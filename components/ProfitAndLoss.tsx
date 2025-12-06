import React, { useState, useMemo, useRef } from 'react';
import { 
    Expense, 
    ManualReceipt, 
    Member, 
    User, 
    ProfitLossEntry,
    IncomeCategoryLevel1,
    IncomeCategoryLevel2,
    ExpenseCategoryLevel1,
    ExpenseCategoryLevel2
} from '../types.ts';
import { Download, Printer, FileText, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Button from './ui/Button.tsx';

interface ProfitAndLossProps {
    expenses: Expense[];
    manualReceipts: ManualReceipt[];
    allMembers: Member[];
    users: User[];
    expenseCategoriesLevel1: ExpenseCategoryLevel1[];
    expenseCategoriesLevel2: ExpenseCategoryLevel2[];
    incomeCategoriesLevel1: IncomeCategoryLevel1[];
    incomeCategoriesLevel2: IncomeCategoryLevel2[];
}

const ProfitAndLoss: React.FC<ProfitAndLossProps> = ({ 
    expenses, 
    manualReceipts, 
    allMembers, 
    users,
    expenseCategoriesLevel1,
    expenseCategoriesLevel2,
    incomeCategoriesLevel1,
    incomeCategoriesLevel2
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const tableRef = useRef<HTMLTableElement>(null);


    const l1ExpMap = useMemo(() => new Map(expenseCategoriesLevel1.map(c => [c.id, c.name])), [expenseCategoriesLevel1]);
    const l2ExpMap = useMemo(() => new Map(expenseCategoriesLevel2.map(c => [c.id, c.name])), [expenseCategoriesLevel2]);

    const l1IncMap = useMemo(() => new Map(incomeCategoriesLevel1.map(c => [c.id, c.name])), [incomeCategoriesLevel1]);
    const l2IncMap = useMemo(() => new Map(incomeCategoriesLevel2.map(c => [c.id, c.name])), [incomeCategoriesLevel2]);

    const getPartyName = (type: 'Customer' | 'Staff' | undefined, id: string | undefined, fallback: string | undefined) => {
        if (type === 'Customer') return allMembers.find(m => m.id === id)?.name || fallback || 'Unknown Customer';
        if (type === 'Staff') return users.find(u => u.id === id)?.name || fallback || 'Unknown Staff';
        return fallback || 'Unknown';
    };


    const tableData: ProfitLossEntry[] = useMemo(() => {

        const groupedData = new Map<string, ProfitLossEntry>();

        const getGroupKey = (l1: string, l2: string, party: string) => `${l1}|${l2}|${party}`;


        expenses.forEach(exp => {
            if (new Date(exp.date) > new Date(filterDate)) return;


            const l1Name = exp.categoryLevel1Id ? (l1ExpMap.get(exp.categoryLevel1Id) || 'Uncategorized Expense') : 'Uncategorized Expense';

            let l2Name = exp.expenseHead || '';
            if (!l2Name && exp.categoryLevel2Id) l2Name = l2ExpMap.get(exp.categoryLevel2Id) || '';
            if (!l2Name) l2Name = 'General';

            const partyName = getPartyName(exp.partyType, exp.partyId, exp.paidTo);
            
            const key = getGroupKey(l1Name, l2Name, partyName);

            if (groupedData.has(key)) {
                const existing = groupedData.get(key)!;
                existing.debit += exp.amount;

                existing.balance = existing.credit - existing.debit;

                if (new Date(exp.date) > new Date(existing.asOnDate)) existing.asOnDate = exp.date;
            } else {
                groupedData.set(key, {
                    id: key,
                    asOnDate: exp.date,
                    category: l1Name,
                    head: l2Name,
                    party: partyName,
                    isCustomer: exp.partyType === 'Customer',
                    debit: exp.amount,
                    credit: 0,
                    balance: -exp.amount
                });
            }
        });


        manualReceipts.forEach(rec => {
             if (new Date(rec.date) > new Date(filterDate)) return;

             const partyName = getPartyName(rec.partyType, rec.partyId, rec.receivedFrom);

             rec.lineItems.forEach((item) => {

                 
                 let l1Name = 'Uncategorized Income';
                 let l2Name = item.incomeCategory || 'General';


                 if (item.incomeCategory && item.incomeCategory.includes(' > ')) {
                     const parts = item.incomeCategory.split(' > ');
                     l1Name = parts[0];
                     l2Name = parts[1];
                 } else {

                     const foundL2 = incomeCategoriesLevel2.find(c => c.name === item.incomeCategory);
                     if (foundL2) {
                         l2Name = foundL2.name;
                         const foundL1 = incomeCategoriesLevel1.find(c => c.id === foundL2.parentId);
                         if (foundL1) l1Name = foundL1.name;
                     } else {

                         const foundL1 = incomeCategoriesLevel1.find(c => c.name === item.incomeCategory);
                         if (foundL1) {
                             l1Name = foundL1.name;
                             l2Name = 'General';
                         }
                     }
                 }

                 const key = getGroupKey(l1Name, l2Name, partyName);

                 if (groupedData.has(key)) {
                    const existing = groupedData.get(key)!;
                    existing.credit += item.amount;
                    existing.balance = existing.credit - existing.debit;
                    if (new Date(rec.date) > new Date(existing.asOnDate)) existing.asOnDate = rec.date;
                 } else {
                    groupedData.set(key, {
                        id: key,
                        asOnDate: rec.date,
                        category: l1Name,
                        head: l2Name,
                        party: partyName,
                        isCustomer: rec.partyType === 'Customer',
                        debit: 0,
                        credit: item.amount,
                        balance: item.amount
                    });
                 }
             });
        });


        const entries = Array.from(groupedData.values());


        entries.sort((a, b) => {
            if (a.category !== b.category) return a.category.localeCompare(b.category);
            if (a.head !== b.head) return a.head.localeCompare(b.head);
            return a.party.localeCompare(b.party);
        });

        return entries;

    }, [expenses, manualReceipts, filterDate, l1ExpMap, l2ExpMap, l1IncMap, l2IncMap, incomeCategoriesLevel1, incomeCategoriesLevel2, allMembers, users]);

    const filteredData = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return tableData.filter(item => 
            item.head.toLowerCase().includes(term) ||
            item.party.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term)
        );
    }, [tableData, searchTerm]);


    const totalDebit = filteredData.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = filteredData.reduce((sum, item) => sum + item.credit, 0);
    const netBalance = totalCredit - totalDebit;


    const handlePrint = () => {
        const printContent = document.getElementById('pl-table-container');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); 
        }
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.text(`Profit & Loss Summary (As on ${filterDate})`, 14, 15);
        
        const tableColumn = ["S.No", "Category (Level 1)", "Head (Level 2)", "Party", "Expenditure", "Income", "Net Value"];
        const tableRows = filteredData.map((row, index) => [
            index + 1,
            row.category,
            row.head,
            row.party,
            row.debit > 0 ? row.debit.toFixed(2) : '-',
            row.credit > 0 ? row.credit.toFixed(2) : '-',
            row.balance.toFixed(2)
        ]);

        tableRows.push(['', 'Total', '', '', totalDebit.toFixed(2), totalCredit.toFixed(2), netBalance.toFixed(2)]);

        // @ts-ignore
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save(`Profit_Loss_${filterDate}.pdf`);
    };

    const handleDownloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData.map((row, index) => ({
            "S.No": index + 1,
            "Category (Level 1)": row.category,
            "Head (Level 2)": row.head,
            "Party": row.party,
            "Expenditure": row.debit,
            "Income": row.credit,
            "Net Value": row.balance
        })));
        
        XLSX.utils.sheet_add_aoa(worksheet, [
            ["", "Total", "", "", totalDebit, totalCredit, netBalance]
        ], { origin: -1 });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Profit & Loss");
        XLSX.writeFile(workbook, `Profit_Loss_${filterDate}.xlsx`);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Profit & Loss</h2>
                    <p className="text-sm text-gray-500">Consolidated overview as on {filterDate}</p>
                </div>
                
                <div className="flex gap-2 items-center">
                    <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                     <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                    </div>
                </div>
            </div>

            <div className="flex gap-2 mb-4 justify-end">
                <Button onClick={handleDownloadPDF} variant="light" size="small">
                    <FileText size={16} /> PDF
                </Button>
                <Button onClick={handleDownloadExcel} variant="light" size="small">
                    <Download size={16} /> Excel
                </Button>
                <Button onClick={handlePrint} variant="light" size="small">
                    <Printer size={16} /> Print
                </Button>
            </div>

            <div className="flex-1 overflow-auto border rounded-lg" id="pl-table-container">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400" ref={tableRef}>
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                        <tr>
                            <th className="px-6 py-3">S.No</th>
                            <th className="px-6 py-3">Category (Level 1)</th>
                            <th className="px-6 py-3">Head (Level 2)</th>
                            <th className="px-6 py-3">Party</th>
                            <th className="px-6 py-3 text-right">Expenditure</th>
                            <th className="px-6 py-3 text-right">Income</th>
                            <th className="px-6 py-3 text-right">Net Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map((row, index) => (
                                <tr key={row.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4">{index + 1}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.category}</td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-200">{row.head}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{row.party}</td>
                                    <td className="px-6 py-4 text-right text-red-600">{row.debit > 0 ? row.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                                    <td className="px-6 py-4 text-right text-green-600">{row.credit > 0 ? row.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>

                                    <td className={`px-6 py-4 text-right font-bold ${row.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {row.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center">No records found.</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-100 dark:bg-gray-700 font-bold text-gray-900 dark:text-white sticky bottom-0">
                        <tr>
                            <td colSpan={4} className="px-6 py-3 text-right">Total</td>
                            <td className="px-6 py-3 text-right text-red-700">{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="px-6 py-3 text-right text-green-700">{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className={`px-6 py-3 text-right ${netBalance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                                {netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default ProfitAndLoss;