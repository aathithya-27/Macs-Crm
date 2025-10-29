import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Member, User, AdvisorLocation, CheckIn, CheckInOutcome, Designation, Role } from '../types.ts'; // MODIFIED: Added Role
import { getOptimalRoute, findClientsOnRoute, suggestSmartTrip } from '../services/geminiService.ts';
import { indianStates } from '../constants.tsx';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Polyline } from '@react-google-maps/api';
import { MapPin, Navigation, Phone, Loader2, Route as RouteIcon, X, BrainCircuit, Users, Compass, Wand2, Check, AlertTriangle, Building, ChevronDown, Search, Copy, ExternalLink, Milestone, CheckCircle, Clock, LogOut, FileText, Calendar, MessageSquare, Target } from 'lucide-react';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
import Modal from './ui/Modal.tsx';
import Textarea from './ui/Textarea.tsx';
import SearchableSelect from './ui/SearchableSelect.tsx';


// Tell TypeScript that the 'google' global object will exist at runtime.
declare var google: any;

const digipinToCoords: Record<string, { lat: number; lng: number }> = {
    '7J4VPQCP+HG': { lat: 11.3410, lng: 77.7172 }, // Erode, Tamil Nadu
    '7JFJ3Q6H+2V': { lat: 19.1678, lng: 72.8647 }, // Mumbai, Goregaon East
    '7JFJ3Q6H+3X': { lat: 19.1679, lng: 72.8648 }, // Mumbai, Goregaon East (Offset)
    '7M52376V+5R': { lat: 13.0604, lng: 80.2495 }, // Chennai, Nungambakkam
    '7J7JGVCC+5R': { lat: 18.5204, lng: 73.8567 }, // Pune
    '7J4RXJJ4+M8': { lat: 12.9716, lng: 77.5946 }, // Bengaluru
};


const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

const deg2rad = (deg: number) => deg * (Math.PI / 180);

type CustomerWithDistance = Member & { distance: number };
type LocationTab = 'planner' | 'path' | 'tracker';

interface AdvisorTrailPoint {
    lat: number;
    lng: number;
    timestamp: string;
}

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2d2d2d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] },
];

const mapLibraries: ('marker' | 'places' | 'routes')[] = ['marker', 'places', 'routes'];

// --- MODIFIED: Added roles to props interface ---
interface LocationServicesProps {
  members: Member[];
  addToast: (message: string, type?: 'success' | 'error') => void;
  currentUser: User | null;
  allUsers: User[];
  onUpdateAdvisorLocation: (locationData: Omit<AdvisorLocation, 'advisorName'>) => Promise<void>;
  onCreateCheckIn: (checkInData: Omit<CheckIn, 'id' | 'advisorName' | 'durationMinutes' | 'checkOutTimestamp'>) => Promise<void>;
  advisorLocations: AdvisorLocation[];
  checkIns: CheckIn[];
  onFetchAdvisorTrail: (advisorId: string) => Promise<AdvisorTrailPoint[]>;
  activeCheckIn: CheckIn | null;
  onCheckOut: (checkInId: string, notes: string, outcome: CheckInOutcome, nextActionDate?: string) => Promise<void>;
  onGetActiveCheckIn: (advisorId: string) => Promise<CheckIn | null>;
  designations: Designation[];
  roles: Role[]; // --- NEW ---
}

const MapErrorDisplay = ({ error }: { error: Error }) => (
    <div className="flex flex-col items-center justify-center h-full text-red-600 dark:text-red-400 p-4 text-center bg-red-50 dark:bg-red-900/20">
        <AlertTriangle className="w-10 h-10 mb-4" />
        <h3 className="text-lg font-semibold">Map Loading Error</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            The map could not be loaded because the Google Maps API key is invalid or not configured for this application.
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The application's API key is configured for AI services and is not valid for Google Maps. A separate, dedicated Google Maps API key is required.
        </p>
        {error.message && (
            <pre className="mt-4 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-left overflow-auto max-w-full">
                {error.message}
            </pre>
        )}
    </div>
);

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const LocationServices: React.FC<LocationServicesProps> = ({ 
    members, addToast, currentUser, allUsers, onUpdateAdvisorLocation, 
    onCreateCheckIn, advisorLocations, checkIns, onFetchAdvisorTrail, 
    activeCheckIn, onCheckOut, onGetActiveCheckIn, designations, roles // --- MODIFIED ---
}) => {
  const [map, setMap] = useState<any | null>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylineRef = useRef<any | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const animationFrameRef = useRef<Record<string, number>>({});

  // Role-based permissions
  const currentUserRole = useMemo(() => roles.find(r => r.id === currentUser?.roleId), [currentUser, roles]);
  const canViewTracker = useMemo(() => {
    return currentUserRole?.canViewLocationTracker === true || 
           (currentUserRole && !currentUserRole.isAdvisor); // Non-advisors can view tracker
  }, [currentUserRole]);
  const isAdvisor = currentUserRole?.isAdvisor === true;

  const [activeTab, setActiveTab] = useState<LocationTab>(canViewTracker ? 'tracker' : 'planner');

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [sortedCustomers, setSortedCustomers] = useState<CustomerWithDistance[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<string[]>([]);

  const [directionsResponse, setDirectionsResponse] = useState<any>(null);
  const [directionsRequestKey, setDirectionsRequestKey] = useState(0);
  const boundsFittedRef = useRef(false);

  const [suggestedTripIds, setSuggestedTripIds] = useState<string[] | null>(null);
  const [isSuggestingTrip, setIsSuggestingTrip] = useState(false);

  const [fromState, setFromState] = useState('Tamil Nadu');
  const [fromDistrict, setFromDistrict] = useState('');
  const [fromDistricts, setFromDistricts] = useState<string[]>([]);
  const [toState, setToState] = useState('Karnataka');
  const [toDistrict, setToDistrict] = useState('');
  const [toDistricts, setToDistricts] = useState<string[]>([]);
  const [clientsOnRoute, setClientsOnRoute] = useState<Member[]>([]);
  const [isFindingClients, setIsFindingClients] = useState(false);
  const [pathSearchPerformed, setPathSearchPerformed] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  
  const [viewMode, setViewMode] = useState<'nearby' | 'city'>('nearby');
  const [expandedCities, setExpandedCities] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedAdvisorForTrail, setSelectedAdvisorForTrail] = useState<User | null>(null);
  const [advisorTrail, setAdvisorTrail] = useState<AdvisorTrailPoint[]>([]);
  const [isFetchingTrail, setIsFetchingTrail] = useState(false);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false); 
  const [expandedCheckInId, setExpandedCheckInId] = useState<string | null>(null);

  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isManualCheckInModalOpen, setIsManualCheckInModalOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);

  const [nearbyCustomersForCheckIn, setNearbyCustomersForCheckIn] = useState<CustomerWithDistance[]>([]);
  
  const [meetingDuration, setMeetingDuration] = useState(0);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    libraries: mapLibraries,
  });
  
  const prevAdvisorLocationsRef = useRef<AdvisorLocation[]>([]);

  const resolvedMembers = useMemo(() => {
    return members.map(member => {
        if (member.lat && member.lng) {
            return member;
        }
        if (member.digipin) {
            const coords = digipinToCoords[member.digipin];
            if (coords) {
                return { ...member, lat: coords.lat, lng: coords.lng };
            }
        }
        return member;
    });
}, [members]);


  useEffect(() => {
    const observer = new MutationObserver(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const fetchUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by your browser.");
        setIsLoadingLocation(false);
        return;
    }
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const currentUserLocation = { lat: latitude, lng: longitude };
            setUserLocation(currentUserLocation);
            setIsLoadingLocation(false);
            setLocationError(null);
        },
        (error) => {
            setLocationError("Could not fetch your location. Using a default location.");
            const defaultLocation = { lat: 20.5937, lng: 78.9629 };
            setUserLocation(defaultLocation);
            setIsLoadingLocation(false);
        }
    );
  }, []);

  useEffect(() => {
    fetchUserLocation();
  }, [fetchUserLocation]);
  
  useEffect(() => {
      if (currentUser && isLoaded) {
          if (!navigator.geolocation) {
              addToast("Geolocation is not supported by your browser.", "error");
              return;
          }
          watchIdRef.current = navigator.geolocation.watchPosition(
              (position) => {
                  const { latitude, longitude } = position.coords;
                  onUpdateAdvisorLocation({
                      advisorId: currentUser.id,
                      lat: latitude,
                      lng: longitude,
                      timestamp: new Date().toISOString()
                  });
              },
              (error) => {
                  if(error.code === error.PERMISSION_DENIED) {
                      addToast("Live location reporting is disabled because permission was denied.", "error");
                      if (watchIdRef.current !== null) {
                         navigator.geolocation.clearWatch(watchIdRef.current);
                         watchIdRef.current = null;
                      }
                  }
              },
              { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
          );
          return () => {
              if (watchIdRef.current !== null) {
                  navigator.geolocation.clearWatch(watchIdRef.current);
              }
          };
      }
  }, [currentUser, isLoaded, onUpdateAdvisorLocation, addToast]);
  
  useEffect(() => {
      if (userLocation) {
        const customersWithDistance = resolvedMembers
            .filter(member => member.lat && member.lng)
            .map(member => ({
                ...member,
                distance: getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, member.lat!, member.lng!)
            }))
            .sort((a, b) => a.distance - b.distance);
        setSortedCustomers(customersWithDistance);
      } else {
        setSortedCustomers(resolvedMembers.map(m => ({...m, distance: -1})).sort((a, b) => a.name.localeCompare(b.name)));
      }
  }, [userLocation, resolvedMembers]);
  
    const customersByCity = useMemo(() => {
        return sortedCustomers.reduce((acc, customer) => {
            const city = customer.city || 'Uncategorized';
            if (!acc[city]) {
                acc[city] = [];
            }
            acc[city].push(customer);
            return acc;
        }, {} as Record<string, CustomerWithDistance[]>);
    }, [sortedCustomers]);

  useEffect(() => {
      if (fromState && indianStates[fromState]) {
          setFromDistricts(indianStates[fromState]);
          setFromDistrict(fromDistrict => indianStates[fromState].includes(fromDistrict) ? fromDistrict : fromDistricts[0] || '');
      }
  }, [fromState, fromDistricts]);

  useEffect(() => {
      if (toState && indianStates[toState]) {
          setToDistricts(indianStates[toState]);
          setToDistrict(toDistrict => indianStates[toState].includes(toDistrict) ? toDistrict : toDistricts[0] || '');
      }
  }, [toState, toDistricts]);
    
  useEffect(() => {
      if (indianStates[fromState]) setFromDistricts(indianStates[fromState]);
      if (indianStates[toState]) setToDistricts(indianStates[toState]);
  }, [fromState, toState]);
  
  const filteredSortedCustomers = useMemo(() => {
    if (!searchQuery) return sortedCustomers;
    return sortedCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.memberId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedCustomers, searchQuery]);

  const filteredCustomersByCity = useMemo(() => {
    if (!searchQuery) return customersByCity;
    const filtered = Object.entries(customersByCity).reduce((acc, [city, customers]) => {
        const filteredCustomers = customers.filter(customer =>
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.memberId.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filteredCustomers.length > 0) {
            acc[city] = filteredCustomers;
        }
        return acc;
    }, {} as Record<string, CustomerWithDistance[]>);
    return filtered;
  }, [customersByCity, searchQuery]);


  const displayCustomers = useMemo(() => {
    if (optimizedRoute.length > 0) {
        const customerMap = new Map(sortedCustomers.map(c => [c.id, c]));
        return optimizedRoute.map(id => customerMap.get(id)).filter(Boolean) as CustomerWithDistance[];
    }
    return filteredSortedCustomers;
  }, [filteredSortedCustomers, sortedCustomers, optimizedRoute]);

  const onMapLoad = useCallback((mapInstance: any) => {
    setMap(mapInstance);
    boundsFittedRef.current = false;
  }, []);

  const onMapUnmount = useCallback((mapInstance: any) => {
    setMap(null);
  }, []);
  
  const visibleCustomersForMap = useMemo(() => {
    if (activeTab === 'tracker' && selectedAdvisorForTrail) {
        return checkIns.filter(c => c.advisorId === selectedAdvisorForTrail.id).map(c => resolvedMembers.find(m => m.id === c.customerId)).filter(Boolean) as Member[];
    }
    if (activeTab === 'path' && clientsOnRoute.length > 0) {
        return clientsOnRoute;
    }
    if (searchQuery) {
        if (viewMode === 'nearby') return filteredSortedCustomers;
        return Object.values(filteredCustomersByCity).flat();
    }
    return resolvedMembers;
  }, [activeTab, clientsOnRoute, searchQuery, viewMode, filteredSortedCustomers, filteredCustomersByCity, resolvedMembers, checkIns, selectedAdvisorForTrail]);

    const animateMarker = useCallback((marker: any, startPos: any, endPos: any, duration: number) => {
        const startTime = performance.now();
        const advisorId = Object.keys(markersRef.current).find(key => markersRef.current[key] === marker);
        if (advisorId && animationFrameRef.current[advisorId]) {
            cancelAnimationFrame(animationFrameRef.current[advisorId]);
        }
        const step = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const fraction = Math.min(elapsedTime / duration, 1);
            const lat = startPos.lat + (endPos.lat - startPos.lat) * fraction;
            const lng = startPos.lng + (endPos.lng - startPos.lng) * fraction;
            marker.position = { lat, lng };
            if (fraction < 1 && advisorId) {
                animationFrameRef.current[advisorId] = requestAnimationFrame(step);
            }
        };
        if(advisorId) animationFrameRef.current[advisorId] = requestAnimationFrame(step);
    }, []);

  useEffect(() => {
      if (!isLoaded || !map) return;

      const currentAdvisorIds = new Set(advisorLocations.map(l => l.advisorId));
      const prevAdvisorLocationsMap = new Map(prevAdvisorLocationsRef.current.map(l => [l.advisorId, l]));

      Object.keys(markersRef.current).forEach(markerId => {
          if (!currentAdvisorIds.has(markerId) && markerId !== 'user_location' && markerId !== 'trail_polyline') {
              if (markersRef.current[markerId] && markersRef.current[markerId].map) {
                markersRef.current[markerId].map = null;
              }
              delete markersRef.current[markerId];
          }
      });

      if (activeTab === 'tracker' && !selectedAdvisorForTrail) {
          advisorLocations.forEach(location => {
              const prevLocation = prevAdvisorLocationsMap.get(location.advisorId);
              const endPos = { lat: location.lat, lng: location.lng };
              if (markersRef.current[location.advisorId]) {
                  const marker = markersRef.current[location.advisorId];
                  const startPos = prevLocation ? { lat: prevLocation.lat, lng: prevLocation.lng } : endPos;
                  if (startPos.lat !== endPos.lat || startPos.lng !== endPos.lng) {
                      animateMarker(marker, startPos, endPos, 4000);
                  }
              } else {
                  const marker = new google.maps.marker.AdvancedMarkerElement({
                      map,
                      position: endPos,
                      title: `${location.advisorName} - Last seen: ${new Date(location.timestamp).toLocaleTimeString()}`
                  });
                  markersRef.current[location.advisorId] = marker;
              }
          });
      } else {
          Object.keys(markersRef.current).forEach(markerId => {
              if(allUsers.find(u => u.id === markerId)) {
                  if (markersRef.current[markerId]) {
                    markersRef.current[markerId].map = null;
                  }
                  delete markersRef.current[markerId];
              }
          });
      }
      prevAdvisorLocationsRef.current = advisorLocations;
  }, [map, isLoaded, advisorLocations, activeTab, selectedAdvisorForTrail, animateMarker, allUsers]);

  useEffect(() => {
    if (!isLoaded || !map) return;
    
    const shouldShowStaticMarkers = !directionsResponse;

    Object.keys(markersRef.current).forEach(id => {
        const isCustomerMarker = members.some(m => m.id === id);
        if (isCustomerMarker && markersRef.current[id]) {
            markersRef.current[id].map = shouldShowStaticMarkers ? map : null;
        }
    });

    if (markersRef.current['user_location']) {
        markersRef.current['user_location'].map = null;
        delete markersRef.current['user_location'];
    }
    if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
    }
    
    const bounds = new google.maps.LatLngBounds();

    if (activeTab === 'tracker' && selectedAdvisorForTrail && advisorTrail.length > 0) {
        const trailPath = advisorTrail.map(p => new google.maps.LatLng(p.lat, p.lng));
        trailPath.forEach(point => bounds.extend(point));

        polylineRef.current = new google.maps.Polyline({
            path: trailPath,
            geodesic: true,
            strokeColor: '#FFA500',
            strokeOpacity: 1.0,
            strokeWeight: 4,
            map: map,
        });

        const advisorCheckIns = checkIns.filter(c => c.advisorId === selectedAdvisorForTrail.id);
        advisorCheckIns.forEach(checkIn => {
            const checkInMarker = new google.maps.marker.AdvancedMarkerElement({
                map,
                position: { lat: checkIn.lat, lng: checkIn.lng },
                title: `Checked in: ${checkIn.customerName} at ${new Date(checkIn.timestamp).toLocaleTimeString()}`,
            });
            markersRef.current[`checkin_${checkIn.id}`] = checkInMarker;
        });
    } else if (shouldShowStaticMarkers && (activeTab === 'planner' || activeTab === 'path')) {
        visibleCustomersForMap.filter(m => m.lat && m.lng).forEach(member => {
            if (!markersRef.current[member.id] || !markersRef.current[member.id].map) {
                 const marker = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: member.lat!, lng: member.lng! }, title: member.name });
                 markersRef.current[member.id] = marker;
            }
            bounds.extend(new google.maps.LatLng(member.lat!, member.lng!));
        });
    }

    if (userLocation && !locationError) {
        const userPin = new google.maps.marker.PinElement({ background: "#4285F4", borderColor: "#ffffff", glyphColor: "#ffffff" });
        const userMarker = new google.maps.marker.AdvancedMarkerElement({ map, position: userLocation, title: "Your Location", content: userPin.element });
        markersRef.current['user_location'] = userMarker;
        if(shouldShowStaticMarkers) {
           bounds.extend(new google.maps.LatLng(userLocation.lat, userLocation.lng));
        }
    }

    if (!bounds.isEmpty() && shouldShowStaticMarkers && !boundsFittedRef.current) {
        map.fitBounds(bounds, 50);
        boundsFittedRef.current = true;
    }
  }, [map, isLoaded, activeTab, selectedAdvisorForTrail, advisorTrail, checkIns, visibleCustomersForMap, userLocation, locationError, directionsResponse, members]);


  const flyToLocation = (lat: number, lng: number) => {
      if (map) {
        map.panTo({ lat, lng });
        map.setZoom(15);
      }
  };
  
    const flyToCity = (city: string) => {
        if (!map || !customersByCity[city]) return;
        const cityCustomers = customersByCity[city].filter(c => c.lat && c.lng);
        if (cityCustomers.length === 0) return;
        if (cityCustomers.length === 1) {
            map.panTo({ lat: cityCustomers[0].lat!, lng: cityCustomers[0].lng! });
            map.setZoom(14);
        } else {
            const bounds = new google.maps.LatLngBounds();
            cityCustomers.forEach(customer => {
                bounds.extend(new google.maps.LatLng(customer.lat!, customer.lng!));
            });
            map.fitBounds(bounds);
        }
    };
  
  const handleToggleCustomerSelection = (customerId: string) => {
      setSelectedCustomerIds(prev =>
          prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId]
      );
  };
  
  const handleSelectAllVisible = () => {
    const allVisibleIds = allVisibleCustomers.map(c => c.id);
    const allSelected = allVisibleCustomers.length > 0 && allVisibleCustomers.every(c => selectedCustomerIds.includes(c.id));

    if (allSelected) {
        setSelectedCustomerIds(prev => prev.filter(id => !allVisibleIds.includes(id)));
    } else {
        setSelectedCustomerIds(prev => [...new Set([...prev, ...allVisibleIds])]);
    }
  };


  const handlePlanRoute = useCallback(async () => {
    if (selectedCustomerIds.length < 1 || !userLocation) {
        addToast("Please select at least 1 customer and ensure your location is available.", 'error');
        return;
    }
    setIsPlanningRoute(true);
    const customersToVisit = resolvedMembers.filter(m => selectedCustomerIds.includes(m.id));
    try {
      const orderedIds = await getOptimalRoute(customersToVisit, userLocation, addToast);
      setOptimizedRoute(orderedIds);
      setDirectionsResponse(null);
      setDirectionsRequestKey(prev => prev + 1);
    } catch (e) {
      console.error("Routing failed", e);
      addToast(`AI routing failed: ${(e as Error).message}. Showing straight lines as fallback.`, "error");
      setOptimizedRoute(customersToVisit.sort((a,b) => getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, a.lat!, a.lng!) - getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, b.lat!, b.lng!)).map(c => c.id));
    } finally {
      setIsPlanningRoute(false);
    }
  }, [selectedCustomerIds, userLocation, resolvedMembers, addToast]);
  
  const handleClearRoute = () => {
      setOptimizedRoute([]);
      setSelectedCustomerIds([]);
      setDirectionsResponse(null);
      boundsFittedRef.current = false;
  };

  const handleSuggestTrip = async () => {
    if (!userLocation) return;
    setIsSuggestingTrip(true);
    const resultIds = await suggestSmartTrip(userLocation, resolvedMembers, addToast);
    setSuggestedTripIds(resultIds);
    setIsSuggestingTrip(false);
  };

  const handleAcceptSuggestion = () => {
    if (suggestedTripIds) {
        setSelectedCustomerIds(suggestedTripIds);
        setSuggestedTripIds(null);
    }
  };

  const handleFindClientsOnRoute = async () => {
    if (!fromState || !fromDistrict || !toState || !toDistrict) {
        addToast("Please select both a start and destination.", 'error');
        return;
    }
    setIsFindingClients(true);
    setClientsOnRoute([]);
    setPathSearchPerformed(true);
    try {
        const startLocation = `${fromDistrict}, ${fromState}`;
        const endLocation = `${toDistrict}, ${toState}`;
        const resultIds = await findClientsOnRoute(startLocation, endLocation, resolvedMembers, addToast);
        
        const foundClients = resolvedMembers.filter(m => resultIds.includes(m.id));
        setClientsOnRoute(foundClients);
        boundsFittedRef.current = false;
    } catch (error) {
        console.error("Failed to find clients on route:", error);
    } finally {
        setIsFindingClients(false);
    }
  };

  const handleClearClientsOnRoute = () => {
      setClientsOnRoute([]);
      setFromDistrict('');
      setToDistrict('');
      setPathSearchPerformed(false);
      boundsFittedRef.current = false;
  };
  
  const handleTabChange = (tab: LocationTab) => {
      setActiveTab(tab);
      setSelectedAdvisorForTrail(null);
      setAdvisorTrail([]);
      setShowMeetingDetails(false);
      setExpandedCheckInId(null); 
      boundsFittedRef.current = false;
      if (tab === 'planner') {
          setClientsOnRoute([]);
          setPathSearchPerformed(false);
      } else if (tab === 'path') {
          handleClearRoute();
          setSuggestedTripIds(null);
      }
  }
  
    const handleSelectAdvisorForTrail = async (advisor: User) => {
        setShowMeetingDetails(false);
        setExpandedCheckInId(null);
        if (selectedAdvisorForTrail?.id === advisor.id) {
            setSelectedAdvisorForTrail(null);
            setAdvisorTrail([]);
            return;
        }
        setSelectedAdvisorForTrail(advisor);
        setIsFetchingTrail(true);
        try {
            const trail = await onFetchAdvisorTrail(advisor.id);
            setAdvisorTrail(trail);
        } catch (error) {
            addToast("Failed to fetch advisor's journey.", "error");
        } finally {
            setIsFetchingTrail(false);
        }
    };
    
    const trailSummary = useMemo(() => {
        if (!advisorTrail || advisorTrail.length < 2) {
            return { distance: 0 };
        }
        let distance = 0;
        for (let i = 1; i < advisorTrail.length; i++) {
            const prevPoint = advisorTrail[i - 1];
            const currentPoint = advisorTrail[i];
            distance += getDistanceFromLatLonInKm(prevPoint.lat, prevPoint.lng, currentPoint.lat, currentPoint.lng);
        }
        return { distance };
    }, [advisorTrail]);

  const allVisibleCustomers = useMemo(() => {
    return viewMode === 'nearby' ? filteredSortedCustomers : Object.values(filteredCustomersByCity).flat();
  }, [viewMode, filteredSortedCustomers, filteredCustomersByCity]);
  
  const areAllVisibleSelected = useMemo(() => {
    if (allVisibleCustomers.length === 0) return false;
    return allVisibleCustomers.every(c => selectedCustomerIds.includes(c.id));
  }, [allVisibleCustomers, selectedCustomerIds]);

  const handleInitiateCheckIn = () => {
      if (!userLocation) {
          addToast("Cannot determine your location for check-in.", "error");
          return;
      }
      const nearby = resolvedMembers
          .filter(m => m.lat && m.lng)
          .map(member => ({
              ...member,
              distance: getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, member.lat!, member.lng!)
          }))
          .filter(member => member.distance <= 1);

      if (nearby.length === 0) {
          setIsManualCheckInModalOpen(true);
      } else {
          setNearbyCustomersForCheckIn(nearby);
          setIsCheckInModalOpen(true);
      }
  };

  const handleConfirmCheckIn = async (customerId: string, type: 'Automatic' | 'Manual', reason?: string) => {
      const customer = resolvedMembers.find(m => m.id === customerId);
      if (userLocation && currentUser && customer) {
          await onCreateCheckIn({
              advisorId: currentUser.id,
              customerId: customer.id,
              customerName: customer.name,
              lat: userLocation.lat,
              lng: userLocation.lng,
              timestamp: new Date().toISOString(),
              checkInType: type,
              manualCheckInReason: reason,
          });
          addToast(`Successfully checked in with ${customer.name}.`, "success");
          setIsCheckInModalOpen(false);
          setIsManualCheckInModalOpen(false);
      } else {
          addToast("Check-in failed. Could not retrieve all required information.", "error");
      }
  };

  useEffect(() => {
      let timer: NodeJS.Timeout;
      if (activeCheckIn) {
          const startTime = new Date(activeCheckIn.timestamp).getTime();
          timer = setInterval(() => {
              const now = new Date().getTime();
              setMeetingDuration((now - startTime) / 1000);
          }, 1000);
      }
      return () => clearInterval(timer);
  }, [activeCheckIn]);

  // Only show advisors in the tracker
  const employeesForTracker = useMemo(() => {
    return allUsers.filter(u => {
      const userRole = roles.find(r => r.id === u.roleId);
      return userRole?.isAdvisor === true;
    });
  }, [allUsers, roles]);


  const PlannerCustomerCard = ({ customer }: { customer: CustomerWithDistance }) => {
    const isSelected = selectedCustomerIds.includes(customer.id);
    const routeIndex = optimizedRoute.indexOf(customer.id);
    
    const handleCopyDigipin = () => {
        if (customer.digipin) {
            navigator.clipboard.writeText(customer.digipin);
            addToast('Digipin copied to clipboard!', 'success');
        }
    };
    
    const handleOpenInMaps = () => {
        if (customer.digipin) {
            window.open(`https://plus.codes/${customer.digipin}`, '_blank');
        } else if (customer.lat && customer.lng) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${customer.lat},${customer.lng}`, '_blank');
        }
    };

    return (
        <div className={`p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border flex flex-col gap-3 transition-all ${isSelected ? 'border-brand-primary ring-2 ring-brand-primary' : 'dark:border-gray-600'}`}>
            <div className="flex items-start gap-3">
                <input 
                   type="checkbox" 
                   checked={isSelected}
                   onChange={() => handleToggleCustomerSelection(customer.id)}
                   className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-brand-primary focus:ring-brand-primary mt-1 flex-shrink-0"
               />
               {routeIndex !== -1 && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white font-bold text-xs flex-shrink-0 mt-0.5">
                        {routeIndex + 1}
                    </div>
               )}
               <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-white">{customer.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{customer.address}</p>
                    {customer.distance > 0 && 
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-2">{customer.distance.toFixed(1)} km away</p>
                    }
                </div>
                <button onClick={() => flyToLocation(customer.lat!, customer.lng!)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-md flex-shrink-0">
                    <MapPin size={18} />
                </button>
            </div>
            {customer.digipin && (
                <div className="pl-8 pt-2 flex items-center justify-between border-t border-gray-200 dark:border-gray-600/50">
                    <p className="text-sm font-mono text-gray-500 dark:text-gray-400">{customer.digipin}</p>
                    <div className="flex items-center gap-1">
                        <Button type="button" variant="light" size="small" className="!p-1.5" onClick={handleCopyDigipin} title="Copy Digipin">
                            <Copy size={12} />
                        </Button>
                        <Button type="button" variant="light" size="small" className="!p-1.5" onClick={handleOpenInMaps} title="Open in Maps">
                            <ExternalLink size={12} />
                        </Button>
                    </div>
                </div>
            )}
            <div className="flex items-center gap-2 pl-8">
                 <a href={`https://www.google.com/maps/dir/?api=1&destination=${customer.lat},${customer.lng}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80">
                    <RouteIcon size={14}/> Navigate
                </a>
                 <a href={`tel:${customer.mobile}`} className="flex-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/80">
                    <Phone size={14}/> Call
                </a>
            </div>
        </div>
    );
  };
  
  const TabButton = ({ label, icon, isActive, onClick }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
        isActive
          ? 'bg-brand-primary text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/60'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const mapCenter = useMemo(() => userLocation || { lat: 20.5937, lng: 78.9629 }, [userLocation]);
  
  const directionsServiceOptions = useMemo(() => {
    if (!userLocation || optimizedRoute.length < 1) return null;

    const routeCustomers = resolvedMembers.filter(m => optimizedRoute.includes(m.id)).filter(Boolean);
    if (routeCustomers.length < 1) return null;

    const origin = { lat: userLocation.lat, lng: userLocation.lng };
    const destination = { lat: routeCustomers[routeCustomers.length - 1]!.lat!, lng: routeCustomers[routeCustomers.length - 1]!.lng! };
    const waypoints = routeCustomers.slice(0, -1).map(c => ({ location: { lat: c!.lat!, lng: c!.lng! }, stopover: true }));

    return {
        origin,
        destination,
        waypoints,
        travelMode: 'DRIVING' as any,
    };
  }, [userLocation, optimizedRoute, resolvedMembers]);
  
  const routePolylinePath = useMemo(() => {
      if (!userLocation || optimizedRoute.length === 0) return [];
      
      const routeCustomers = optimizedRoute.map(id => resolvedMembers.find(m => m.id === id)).filter(c => c && c.lat && c.lng);
      if (routeCustomers.length === 0) return [];
      
      const path = [
          { lat: userLocation.lat, lng: userLocation.lng },
          ...routeCustomers.map(c => ({ lat: c.lat!, lng: c.lng! }))
      ];
      return path;
  }, [userLocation, optimizedRoute, resolvedMembers]);

  const onDirectionsResult = useCallback((result: any, status: any) => {
    if (status === 'OK') {
        setDirectionsResponse(result);
    } else {
        console.error(`Error fetching directions: ${status}`);
        addToast("Could not fetch road directions. Displaying straight lines as fallback.", "error");
        setDirectionsResponse(null);
    }
  }, [addToast]);


  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Location Services</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Visualize locations, find nearby clients, and plan optimized routes with AI.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-14rem)]">
        
        <div className="lg:w-[40%] xl:w-1/3 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col">
            <div className="p-3 border-b dark:border-gray-700 flex-shrink-0">
              <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                  <TabButton label="Route Planner" icon={<Users size={16}/>} isActive={activeTab === 'planner'} onClick={() => handleTabChange('planner')} />
                  <TabButton label="Path Finder" icon={<Compass size={16} />} isActive={activeTab === 'path'} onClick={() => handleTabChange('path')} />
                  {canViewTracker && <TabButton label="Tracker" icon={<Milestone size={16} />} isActive={activeTab === 'tracker'} onClick={() => handleTabChange('tracker')} />}
              </div>
            </div>
            
             {isAdvisor && (
                <div className="p-4 border-b dark:border-gray-700">
                    {activeCheckIn ? (
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 rounded-r-lg">
                            <div className="flex justify-between items-center">
                               <div>
                                    <p className="text-xs text-green-700 dark:text-green-300 font-semibold">ACTIVE MEETING</p>
                                    <p className="font-bold text-lg text-gray-800 dark:text-white">{activeCheckIn.customerName}</p>
                               </div>
                               <p className="font-mono text-xl font-bold text-green-600 dark:text-green-300 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm">{formatDuration(meetingDuration)}</p>
                            </div>
                           <Button variant="danger" size="default" className="w-full mt-4" onClick={() => setIsCheckOutModalOpen(true)}>
                                <LogOut size={16} />
                                Check-out & Log Details
                            </Button>
                        </div>
                    ) : (
                         <Button variant="primary" size="default" className="w-full" onClick={handleInitiateCheckIn} disabled={!userLocation}>
                            <CheckCircle size={20} />
                            Check-in with Customer
                        </Button>
                    )}
                </div>
            )}

            {activeTab === 'planner' && (
              <>
                <div className="p-4 border-b dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Customer Route Planner</h3>
                    
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search Customers to Visit
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                type="text"
                                id="customer-search"
                                placeholder="Search by name, city, or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                         <Button variant="light" onClick={handleSuggestTrip} disabled={isSuggestingTrip || !userLocation} size="small">
                            {isSuggestingTrip ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16}/>}
                            Suggest Trip
                         </Button>
                        <Button variant="primary" onClick={handlePlanRoute} disabled={isPlanningRoute || selectedCustomerIds.length < 1 || !userLocation} size="small" className="flex-1">
                            {isPlanningRoute ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                            Plan Route ({selectedCustomerIds.length})
                        </Button>
                    </div>
                     {optimizedRoute.length > 0 && 
                        <Button variant="danger" onClick={handleClearRoute} size="small" className="w-full mt-2">
                            <X size={16} /> Clear Planned Route
                        </Button>
                    }
                     <div className="mt-4 flex gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('nearby')}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'nearby' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>
                            <Users size={16} /> Nearby
                        </button>
                        <button
                            onClick={() => setViewMode('city')}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'city' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>
                            <Building size={16} /> By City
                        </button>
                    </div>
                </div>
                <div className="overflow-y-auto p-4 space-y-3 flex-1">
                    {isLoadingLocation && <div className="text-center p-4 text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /><p className="mt-2 text-sm">Fetching your location...</p></div>}
                    {locationError && <div className="text-center p-4 text-sm bg-yellow-50 text-yellow-700 rounded-md dark:bg-yellow-900/50 dark:text-yellow-300">{locationError}</div>}
                    
                    {suggestedTripIds && (
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg animate-fade-in space-y-3">
                            <h4 className="font-semibold text-indigo-800 dark:text-indigo-200">AI Suggested Trip:</h4>
                            <ul className="list-decimal list-inside text-sm text-indigo-700 dark:text-indigo-300">
                                {suggestedTripIds.map(id => {
                                    const member = members.find(m => m.id === id);
                                    return <li key={id}>{member ? member.name : 'Unknown Client'}</li>
                                })}
                            </ul>
                            <div className="flex gap-2">
                               <Button variant="secondary" size="small" onClick={() => setSuggestedTripIds(null)}><X size={14}/> Dismiss</Button>
                               <Button variant="success" size="small" onClick={handleAcceptSuggestion}><Check size={14}/> Accept Suggestion</Button>
                           </div>
                        </div>
                    )}
                    
                    {allVisibleCustomers.length > 0 && (
                        <div className="flex items-center gap-3 p-2 bg-gray-100 dark:bg-gray-900 rounded-md">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                checked={areAllVisibleSelected}
                                onChange={handleSelectAllVisible}
                            />
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {areAllVisibleSelected ? 'Deselect All' : 'Select All'} ({allVisibleCustomers.length})
                            </label>
                            <span className="flex-1 text-right text-sm font-semibold text-brand-primary">
                                {selectedCustomerIds.length} Selected
                            </span>
                        </div>
                    )}


                    {viewMode === 'nearby' && (
                        displayCustomers.length > 0 ? (
                            displayCustomers.map(customer => <PlannerCustomerCard key={customer.id} customer={customer} />)
                        ) : (
                            !isLoadingLocation && <p className="text-center py-8 text-gray-500 dark:text-gray-400">No customers found.</p>
                        )
                    )}

                    {viewMode === 'city' && (
                         <div className="space-y-2">
                            {Object.keys(filteredCustomersByCity).sort().map(city => {
                                const customersInCity = filteredCustomersByCity[city];
                                const isExpanded = expandedCities.includes(city);
                                return (
                                    <div key={city}>
                                        <button 
                                            onClick={() => {
                                                setExpandedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
                                                flyToCity(city);
                                            }}
                                            className="w-full flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-left"
                                        >
                                            <span className="font-semibold text-gray-800 dark:text-white">{city}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold px-2 py-0.5 rounded-full">
                                                    {customersInCity.length}
                                                </span>
                                                <ChevronDown size={16} className={`transition-transform text-gray-500 dark:text-gray-400 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>
                                        {isExpanded && (
                                            <div className="pl-4 pt-3 mt-1 space-y-3 border-l-2 border-gray-200 dark:border-gray-600 ml-4 animate-fade-in">
                                                {customersInCity.map(customer => (
                                                    <PlannerCustomerCard key={customer.id} customer={customer} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
              </>
            )}

            {activeTab === 'path' && (
              <div className="flex flex-col flex-1">
                <div className="p-4 border-b dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">Find Clients on Path</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a start and end point to find clients along the travel route.</p>
                </div>
                <div className="overflow-y-auto p-4 space-y-4 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">From</h4>
                          <div className="space-y-3">
                              <select value={fromState} onChange={(e) => setFromState(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                  {Object.keys(indianStates).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <select value={fromDistrict} onChange={(e) => setFromDistrict(e.target.value)} disabled={fromDistricts.length === 0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                  <option value="">Select District</option>
                                  {fromDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                          </div>
                      </div>
                      <div>
                          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">To</h4>
                          <div className="space-y-3">
                              <select value={toState} onChange={(e) => setToState(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                  {Object.keys(indianStates).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <select value={toDistrict} onChange={(e) => setToDistrict(e.target.value)} disabled={toDistricts.length === 0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                  <option value="">Select District</option>
                                  {toDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <Button variant="primary" onClick={handleFindClientsOnRoute} disabled={isFindingClients || !fromDistrict || !toDistrict}>
                          {isFindingClients ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                          Find Clients on Path
                      </Button>
                      {pathSearchPerformed && 
                          <Button variant="secondary" onClick={handleClearClientsOnRoute}>
                              <X size={16} /> Clear Path
                          </Button>
                      }
                  </div>
                  
                  {isFindingClients && (
                      <div className="text-center p-6 text-gray-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          <p className="mt-2 text-sm">Gemini is analyzing the route...</p>
                      </div>
                  )}

                  {pathSearchPerformed && !isFindingClients && (
                      <div className="mt-4">
                          <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Found {clientsOnRoute.length} client(s) on the path:</h4>
                          {clientsOnRoute.length > 0 ? (
                            <div className="space-y-3">
                                {clientsOnRoute.map(customer => (
                                    <div key={customer.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600/50">
                                        <p className="font-semibold text-gray-800 dark:text-white">{customer.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{customer.address}</p>
                                        <div className="mt-2 flex items-center gap-4">
                                            <button onClick={() => flyToLocation(customer.lat!, customer.lng!)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1">
                                                <MapPin size={14}/> View on Map
                                            </button>
                                            <a href={`tel:${customer.mobile}`} className="text-green-600 hover:text-green-800 text-xs font-semibold flex items-center gap-1">
                                                <Phone size={14}/> Call Client
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                          ) : (
                             <p className="text-center py-6 text-gray-500 dark:text-gray-400">No clients found on this route.</p>
                          )}
                      </div>
                  )}

                </div>
              </div>
            )}
            
            {activeTab === 'tracker' && (
                <div className="flex flex-col flex-1">
                    <div className="p-4 border-b dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Employee Live Tracking</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View live locations or select an employee to see their daily journey.</p>
                    </div>
                     {selectedAdvisorForTrail && (
                        <div className="p-4 bg-gray-100 dark:bg-gray-900 border-b dark:border-gray-700 animate-fade-in">
                            <h4 className="font-semibold text-gray-800 dark:text-white">Daily Activity for: {selectedAdvisorForTrail.name}</h4>
                            <div className="mt-3 grid grid-cols-2 gap-4">
                                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Distance</p>
                                    <p className="text-lg font-bold text-brand-primary">{trailSummary.distance.toFixed(2)} km</p>
                                </div>
                                 <button 
                                    onClick={() => setShowMeetingDetails(prev => !prev)} 
                                    disabled={checkIns.filter(c => c.advisorId === selectedAdvisorForTrail.id).length === 0}
                                    className="p-2 bg-white dark:bg-gray-800 rounded-lg text-center w-full hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Meetings</p>
                                    <p className="text-lg font-bold text-brand-primary">{checkIns.filter(c => c.advisorId === selectedAdvisorForTrail.id).length}</p>
                                </button>
                            </div>
                        </div>
                     )}
                     {selectedAdvisorForTrail && showMeetingDetails && (
                        <div className="p-4 border-b dark:border-gray-700 animate-fade-in">
                            <h5 className="font-semibold text-gray-800 dark:text-white mb-2">Meeting Details & Logs</h5>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {checkIns.filter(c => c.advisorId === selectedAdvisorForTrail.id).length > 0 ? (
                                    checkIns.filter(c => c.advisorId === selectedAdvisorForTrail.id)
                                    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                    .map(checkIn => {
                                        const isExpanded = expandedCheckInId === checkIn.id;
                                        return (
                                        <div key={checkIn.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-md">
                                            <button onClick={() => setExpandedCheckInId(prev => prev === checkIn.id ? null : checkIn.id)} className="w-full flex justify-between items-center p-2 text-left">
                                                <div>
                                                    <p className="font-medium text-sm text-gray-800 dark:text-white">{checkIn.customerName}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {checkIn.checkOutTimestamp ? ` - ${new Date(checkIn.checkOutTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' (Active)'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                     <Button variant="light" size="small" className="!p-1.5" onClick={(e) => { e.stopPropagation(); flyToLocation(checkIn.lat, checkIn.lng); }} title={`View ${checkIn.customerName}'s location`}>
                                                        <MapPin size={14} />
                                                    </Button>
                                                    <ChevronDown size={16} className={`transition-transform text-gray-500 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </button>
                                            {isExpanded && (
                                                <div className="p-3 border-t border-gray-200 dark:border-gray-700 animate-fade-in-fast">
                                                    {checkIn.checkOutTimestamp ? (
                                                        <div className="space-y-3 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Clock size={14} className="text-gray-500" />
                                                                <span>Duration: <span className="font-semibold">{checkIn.durationMinutes?.toFixed(0) || 'N/A'} mins</span></span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Target size={14} className="text-gray-500" />
                                                                <span>Outcome: <span className="font-semibold">{checkIn.outcome}</span></span>
                                                            </div>
                                                            {checkIn.nextActionDate && (
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar size={14} className="text-gray-500" />
                                                                    <span>Follow-up: <span className="font-semibold">{new Date(checkIn.nextActionDate).toLocaleDateString()}</span></span>
                                                                </div>
                                                            )}
                                                            {checkIn.notes && (
                                                                <div className="flex items-start gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                                    <MessageSquare size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                                                                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{checkIn.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-center text-gray-500 italic py-2">Meeting is currently in progress.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )})
                                ) : (
                                    <p className="text-sm text-center text-gray-500 py-4">No meetings recorded today.</p>
                                )}
                            </div>
                        </div>
                     )}
                     <div className="overflow-y-auto p-4 space-y-2 flex-1">
                         {isFetchingTrail && <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></div>}
                         {employeesForTracker.map(employee => {
                            const employeeRole = roles.find(r => r.id === employee.roleId);
                            const location = advisorLocations.find(l => l.advisorId === employee.id);
                            const isSelected = selectedAdvisorForTrail?.id === employee.id;
                            const isActiveMeeting = checkIns.some(c => c.advisorId === employee.id && !c.checkOutTimestamp);
                            const isEmployeeAdvisor = employeeRole?.isAdvisor === true;
                            return (
                                <button key={employee.id} onClick={() => handleSelectAdvisorForTrail(employee)} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-2 dark:ring-offset-gray-800 ${isActiveMeeting ? 'bg-yellow-400 ring-yellow-300' : location ? 'bg-green-500 ring-green-400' : 'bg-gray-400 ring-gray-300'}`}></div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800 dark:text-white">{employee.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {isEmployeeAdvisor ? (
                                                isActiveMeeting ? `In a meeting` : location ? `Last seen at ${new Date(location.timestamp).toLocaleTimeString()}` : 'Offline'
                                            ) : (
                                                location ? `Live tracking - ${new Date(location.timestamp).toLocaleTimeString()}` : 'Offline'
                                            )}
                                        </p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                            {isEmployeeAdvisor ? 'Advisor (Check-in enabled)' : 'Employee (Live tracking)'}
                                        </p>
                                    </div>
                                </button>
                            )
                         })}
                     </div>
                </div>
            )}
        </div>

        <div className="flex-1 min-h-[500px] lg:min-h-0 lg:h-full rounded-lg shadow-sm overflow-hidden border dark:border-gray-700 relative">
            <div className="h-full w-full bg-gray-200 dark:bg-gray-700">
                {!isLoaded && !loadError ? (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="ml-4">Loading Map...</span>
                    </div>
                ) : loadError ? (
                    <MapErrorDisplay error={loadError} />
                ) : (
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={mapCenter}
                        zoom={5}
                        onLoad={onMapLoad}
                        onUnmount={onMapUnmount}
                        options={{
                            styles: isDarkMode ? mapStyles : undefined,
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: false,
                            zoomControl: true,
                            mapId: 'FINROOTS_CRM_MAP'
                        }}
                    >
                       {directionsServiceOptions && (
                            <DirectionsService
                                key={directionsRequestKey}
                                options={directionsServiceOptions}
                                callback={onDirectionsResult}
                            />
                       )}

                       {directionsResponse && (
                            <DirectionsRenderer
                                options={{
                                    directions: directionsResponse,
                                    suppressMarkers: true,
                                    polylineOptions: {
                                        strokeColor: '#2563EB',
                                        strokeOpacity: 0.8,
                                        strokeWeight: 6,
                                    }
                                }}
                            />
                       )}
                       
                       {!directionsResponse && optimizedRoute.length > 0 && (
                            <Polyline
                                path={routePolylinePath}
                                options={{
                                    strokeColor: '#FF0000',
                                    strokeOpacity: 0.8,
                                    strokeWeight: 4,
                                }}
                            />
                       )}
                    </GoogleMap>
                )}
            </div>
          <button 
            onClick={() => userLocation && flyToLocation(userLocation.lat, userLocation.lng)} 
            disabled={!userLocation} 
            className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-gray-700/90 p-2 rounded-full shadow-lg text-gray-700 hover:bg-white disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-600"
            aria-label="Center on my location"
          >
            <Navigation size={20} />
          </button>
        </div>
      </div>
       {isCheckInModalOpen && (
           <Modal isOpen={isCheckInModalOpen} onClose={() => setIsCheckInModalOpen(false)}>
               <div className="p-6">
                   <h3 className="text-lg font-bold text-gray-800 dark:text-white">Check-in with Customer</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select the customer you are meeting from the list of nearby clients.</p>
               </div>
               <div className="p-6 max-h-80 overflow-y-auto">
                   <div className="space-y-3">
                       {nearbyCustomersForCheckIn.map(customer => (
                           <button key={customer.id} onClick={() => handleConfirmCheckIn(customer.id, 'Automatic')} className="w-full text-left p-4 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                               <p className="font-semibold">{customer.name}</p>
                               <p className="text-sm text-gray-500 dark:text-gray-400">{customer.address}</p>
                               <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-2">{(customer.distance * 1000).toFixed(0)} meters away</p>
                           </button>
                       ))}
                   </div>
               </div>
               <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
                   <Button variant="secondary" onClick={() => setIsCheckInModalOpen(false)}>Cancel</Button>
               </div>
           </Modal>
       )}
       {isManualCheckInModalOpen && (
           <ManualCheckInModal
                isOpen={isManualCheckInModalOpen}
                onClose={() => setIsManualCheckInModalOpen(false)}
                customers={resolvedMembers}
                onConfirm={handleConfirmCheckIn}
           />
       )}
       {isCheckOutModalOpen && activeCheckIn && (
            <CheckOutModal
                isOpen={isCheckOutModalOpen}
                onClose={() => setIsCheckOutModalOpen(false)}
                checkIn={activeCheckIn}
                onConfirm={onCheckOut}
            />
       )}
    </div>
  );
};

const ManualCheckInModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    customers: Member[];
    onConfirm: (customerId: string, type: 'Manual', reason: string) => void;
}> = ({ isOpen, onClose, customers, onConfirm }) => {
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [reason, setReason] = useState('');

    const customerOptions = useMemo(() => customers.map(c => ({ value: c.id, label: `${c.name} - ${c.city}` })), [customers]);

    const handleSubmit = () => {
        if (!selectedCustomerId) {
            alert('Please select a customer.');
            return;
        }
        onConfirm(selectedCustomerId, 'Manual', reason || 'Manual Check-in');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Manual Check-in</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No customers detected nearby. Please select the customer you are meeting manually.</p>
            </div>
            <div className="p-6 space-y-4">
                <SearchableSelect
                    label="Select Customer"
                    options={customerOptions}
                    value={selectedCustomerId}
                    onChange={setSelectedCustomerId}
                    placeholder="Search for a customer..."
                />
                <Input
                    label="Reason for Manual Check-in (Optional)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., GPS inaccuracy"
                />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={!selectedCustomerId}>Confirm Check-in</Button>
            </div>
        </Modal>
    );
};

const CheckOutModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    checkIn: CheckIn;
    onConfirm: (checkInId: string, notes: string, outcome: CheckInOutcome, nextActionDate?: string) => void;
}> = ({ isOpen, onClose, checkIn, onConfirm }) => {
    const [notes, setNotes] = useState('');
    const [outcome, setOutcome] = useState<CheckInOutcome>('Follow-up Scheduled');
    const [nextActionDate, setNextActionDate] = useState('');

    const outcomeOptions: CheckInOutcome[] = ['Proposal Sent', 'Follow-up Scheduled', 'Sale Closed', 'No Progress', 'Other'];

    const handleSubmit = () => {
        onConfirm(checkIn.id, notes, outcome, nextActionDate);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-300">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Meeting Summary</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Log the details for your meeting with <span className="font-semibold">{checkIn.customerName}</span>.</p>
                    </div>
                </div>
            </div>
            <div className="p-6 space-y-4 border-y dark:border-gray-700">
                <Textarea
                    label="Meeting Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter key discussion points, customer feedback, etc."
                    rows={4}
                />
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Outcome</label>
                    <select value={outcome} onChange={e => setOutcome(e.target.value as CheckInOutcome)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        {outcomeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
                {outcome === 'Follow-up Scheduled' && (
                     <Input
                        label="Next Follow-up Date"
                        type="date"
                        value={nextActionDate}
                        onChange={(e) => setNextActionDate(e.target.value)}
                    />
                )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSubmit}>Confirm Check-out</Button>
            </div>
        </Modal>
    )
}

export default LocationServices;