import React, { useEffect, useState } from 'react';
import api from '../api';
import { Button, Input, FileInput, Card } from '../components/ui';
import Modal from '../components/Modal';
import { Plus, Briefcase, FileText, Calendar } from 'lucide-react';

const Salary = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [salaries, setSalaries] = useState([]);
  
  const [showCompModal, setShowCompModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forms
  const [compForm, setCompForm] = useState({ name: '', joining_date: '', relieving_date: '', is_current: false });
  const [compLogo, setCompLogo] = useState(null);
  
  const [slipForm, setSlipForm] = useState({ amount: '', month: 'January', year: new Date().getFullYear() });
  const [slipFile, setSlipFile] = useState(null);

  // Sync
  useEffect(() => {
    fetchCompanies();
    const interval = setInterval(fetchCompanies, 15000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCompany) {
        fetchSalaries(selectedCompany.id);
    }
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
        const res = await api.get('/api/salary/companies');
        setCompanies(res.data);
        // Select first company by default if none selected
        if (!selectedCompany && res.data.length > 0) {
            setSelectedCompany(res.data[0]);
        }
    } catch(e) {}
  };

  const fetchSalaries = async (compId) => {
    try {
        const res = await api.get(`/api/salary/slips/${compId}`);
        setSalaries(res.data);
    } catch(e) {}
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('name', compForm.name);
    formData.append('joining_date', compForm.joining_date);
    if(compForm.relieving_date) formData.append('relieving_date', compForm.relieving_date);
    formData.append('is_current', compForm.is_current);
    if(compLogo) formData.append('logo', compLogo);

    await api.post('/api/salary/companies', formData);
    setLoading(false);
    setShowCompModal(false);
    fetchCompanies();
  };

  const handleAddSlip = async (e) => {
    e.preventDefault();
    if(!selectedCompany) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('company_id', selectedCompany.id);
    formData.append('amount', slipForm.amount);
    formData.append('month', slipForm.month);
    formData.append('year', slipForm.year);
    if(slipFile) formData.append('slip', slipFile);

    await api.post('/api/salary/slips', formData);
    setLoading(false);
    setShowSlipModal(false);
    fetchSalaries(selectedCompany.id);
  };

  const totalSalary = salaries.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      {/* Top Section: Companies (Horizontal Scroll) */}
      <div className="flex-none">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Work History</h2>
            <Button size="sm" onClick={() => setShowCompModal(true)}><Plus size={18}/> Company</Button>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
            {companies.map(comp => (
                <div 
                    key={comp.id}
                    onClick={() => setSelectedCompany(comp)}
                    className={`flex-none w-64 p-4 rounded-xl border cursor-pointer transition-all ${selectedCompany?.id === comp.id ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' : 'bg-surface border-white/5 hover:bg-white/5'}`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        {comp.logo_path ? (
                            <img src={`/uploads/${comp.logo_path}`} className="w-10 h-10 rounded-full object-cover bg-white"/>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center"><Briefcase size={20}/></div>
                        )}
                        <div>
                            <h3 className="font-bold text-white truncate w-32">{comp.name}</h3>
                            <p className="text-[10px] text-slate-400">{new Date(comp.joining_date).getFullYear()} - {comp.is_current ? 'Present' : new Date(comp.relieving_date).getFullYear()}</p>
                        </div>
                    </div>
                    {selectedCompany?.id === comp.id && (
                         <div className="text-xs font-mono text-primary-300 mt-2 pt-2 border-t border-white/10">
                            Total Earned: ₹{(salaries.reduce((a,c) => a + c.amount, 0)/100000).toFixed(2)}L
                         </div>
                    )}
                </div>
            ))}
            {companies.length === 0 && <div className="text-slate-500 p-4 border border-dashed border-slate-700 rounded-xl w-64 flex items-center justify-center">No companies added</div>}
        </div>
      </div>

      {/* Bottom Section: Salary Slips (Scrollable List) */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-surface/50 rounded-2xl border border-white/5">
         <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <FileText className="text-slate-400" size={20}/>
                <span className="font-semibold text-white">Salary Slips</span>
            </div>
            {selectedCompany && <Button size="sm" onClick={() => setShowSlipModal(true)}><Plus size={16}/> Add Slip</Button>}
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!selectedCompany ? (
                <div className="h-full flex items-center justify-center text-slate-500">Select a company to view slips</div>
            ) : salaries.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500">No slips uploaded yet</div>
            ) : (
                salaries.map(slip => (
                    <div key={slip.id} className="flex justify-between items-center p-3 bg-black/40 rounded-lg border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs">
                                {slip.month.substring(0,3)}
                            </div>
                            <div>
                                <p className="font-bold text-white">₹{slip.amount.toLocaleString()}</p>
                                <p className="text-xs text-slate-400">{slip.month} {slip.year}</p>
                            </div>
                        </div>
                        {slip.attachment_path && (
                            <Button variant="ghost" size="sm" onClick={() => window.open(`/uploads/${slip.attachment_path}`, '_blank')}>
                                View Slip
                            </Button>
                        )}
                    </div>
                ))
            )}
         </div>
         
         {/* Footer Summary */}
         {selectedCompany && (
             <div className="p-4 border-t border-white/5 bg-black/40">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total for {selectedCompany.name}</span>
                    <span className="font-bold text-green-400">₹{totalSalary.toLocaleString()}</span>
                </div>
             </div>
         )}
      </div>

      {/* Modals */}
      <Modal isOpen={showCompModal} onClose={()=>setShowCompModal(false)} title="Add Company">
          <form onSubmit={handleAddCompany} className="space-y-4">
              <Input label="Company Name" value={compForm.name} onChange={e=>setCompForm({...compForm, name: e.target.value})} required/>
              <div className="grid grid-cols-2 gap-4">
                  <Input label="Joining Date" type="date" value={compForm.joining_date} onChange={e=>setCompForm({...compForm, joining_date: e.target.value})} required/>
                  <Input label="Relieving Date" type="date" value={compForm.relieving_date} onChange={e=>setCompForm({...compForm, relieving_date: e.target.value})} />
              </div>
              <div className="flex items-center gap-2">
                  <input type="checkbox" checked={compForm.is_current} onChange={e=>setCompForm({...compForm, is_current: e.target.checked})} className="w-4 h-4"/>
                  <label className="text-sm">Currently working here</label>
              </div>
              <FileInput label="Company Logo" onChange={e=>setCompLogo(e.target.files[0])} accept="image/*"/>
              <Button type="submit" className="w-full" isLoading={loading}>Save</Button>
          </form>
      </Modal>

      <Modal isOpen={showSlipModal} onClose={()=>setShowSlipModal(false)} title="Add Salary Slip">
          <form onSubmit={handleAddSlip} className="space-y-4">
              <Input label="Amount (In Hand)" type="number" value={slipForm.amount} onChange={e=>setSlipForm({...slipForm, amount: e.target.value})} required/>
              <div className="grid grid-cols-2 gap-4">
                  <select className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={slipForm.month} onChange={e=>setSlipForm({...slipForm, month: e.target.value})}>
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m=><option key={m}>{m}</option>)}
                  </select>
                  <Input type="number" value={slipForm.year} onChange={e=>setSlipForm({...slipForm, year: e.target.value})}/>
              </div>
              <FileInput label="Upload Slip (PDF/Img)" onChange={e=>setSlipFile(e.target.files[0])} accept=".pdf,image/*"/>
              <Button type="submit" className="w-full" isLoading={loading}>Upload</Button>
          </form>
      </Modal>
    </div>
  );
};

export default Salary;