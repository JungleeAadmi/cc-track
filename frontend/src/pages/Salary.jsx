import React, { useEffect, useState } from 'react';
import api from '../api';
import { Button, Input, FileInput } from '../components/ui';
import Modal from '../components/Modal';
import useLongPress from '../hooks/useLongPress';
import { Plus, Briefcase, FileText } from 'lucide-react';

const ActionMenu = ({ isOpen, onClose, onDelete }) => {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <div className="bg-surface w-full max-w-sm rounded-xl border border-white/10 overflow-hidden" onClick={e=>e.stopPropagation()}>
                <button onClick={onDelete} className="w-full p-4 text-left text-red-400 hover:bg-red-500/10 border-b border-white/5">Delete Company</button>
                <button onClick={onClose} className="w-full p-4 text-center text-slate-500 hover:bg-white/5">Cancel</button>
            </div>
        </div>
    );
};

const Salary = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [salaries, setSalaries] = useState([]);
  
  const [showCompModal, setShowCompModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [actionCompany, setActionCompany] = useState(null);
  const [loading, setLoading] = useState(false);

  const [compForm, setCompForm] = useState({ name: '', joining_date: '', relieving_date: '', is_current: false });
  const [compLogo, setCompLogo] = useState(null);
  const [slipForm, setSlipForm] = useState({ amount: '', month: 'January', year: new Date().getFullYear() });
  const [slipFile, setSlipFile] = useState(null);

  useEffect(() => { fetchCompanies(); }, []);
  useEffect(() => { if (selectedCompany) fetchSalaries(selectedCompany.id); }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
        const res = await api.get('/api/salary/companies');
        setCompanies(res.data);
        if (!selectedCompany && res.data.length > 0) setSelectedCompany(res.data[0]);
    } catch(e) {}
  };

  const fetchSalaries = async (compId) => {
    try { const res = await api.get(`/api/salary/slips/${compId}`); setSalaries(res.data); } catch(e) {}
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('name', compForm.name);
    formData.append('joining_date', compForm.joining_date);
    if(!compForm.is_current && compForm.relieving_date) formData.append('relieving_date', compForm.relieving_date);
    formData.append('is_current', compForm.is_current);
    if(compLogo) formData.append('logo', compLogo);

    await api.post('/api/salary/companies', formData);
    setLoading(false); setShowCompModal(false); fetchCompanies();
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

    try {
        await api.post('/api/salary/slips', formData);
        setShowSlipModal(false); fetchSalaries(selectedCompany.id);
    } catch(e) { alert("Failed to upload slip. Check size < 25MB"); }
    finally { setLoading(false); }
  };

  const longPressProps = useLongPress(
    (e) => {
        const cId = e.target.closest('[data-comp-id]')?.dataset.compId;
        const c = companies.find(i => i.id == cId);
        if(c) setActionCompany(c);
    },
    (e) => {
        const cId = e.target.closest('[data-comp-id]')?.dataset.compId;
        const c = companies.find(i => i.id == cId);
        if(c) setSelectedCompany(c);
    },
    { delay: 800, shouldPreventDefault: true }
  );

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex-none">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Work History</h2>
            <Button size="sm" onClick={() => setShowCompModal(true)}><Plus size={18}/> Company</Button>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
            {companies.map(comp => (
                <div 
                    key={comp.id} data-comp-id={comp.id} {...longPressProps}
                    className={`flex-none w-64 p-4 rounded-xl border cursor-pointer select-none touch-manipulation ${selectedCompany?.id === comp.id ? 'bg-primary/20 border-primary shadow-lg' : 'bg-surface border-white/5'}`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        {comp.logo_path ? <img src={`/uploads/${comp.logo_path}`} className="w-10 h-10 rounded-full object-cover bg-white"/> : <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center"><Briefcase size={20}/></div>}
                        <div>
                            <h3 className="font-bold text-white truncate w-32">{comp.name}</h3>
                            <p className="text-[10px] text-slate-400">{new Date(comp.joining_date).getFullYear()} - {comp.is_current ? 'Present' : new Date(comp.relieving_date).getFullYear()}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
      
      <ActionMenu isOpen={!!actionCompany} onClose={() => setActionCompany(null)} onDelete={() => alert("Delete coming in v2.1")} />

      <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-surface/50 rounded-2xl border border-white/5">
         <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <span className="font-semibold text-white">Salary Slips</span>
            {selectedCompany && <Button size="sm" onClick={() => setShowSlipModal(true)}><Plus size={16}/> Add Slip</Button>}
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {salaries.map(slip => (
                <div key={slip.id} className="flex justify-between items-center p-3 bg-black/40 rounded-lg">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs">{slip.month.substring(0,3)}</div>
                        <div><p className="font-bold text-white">₹{slip.amount.toLocaleString()}</p><p className="text-xs text-slate-400">{slip.month} {slip.year}</p></div>
                    </div>
                    {slip.attachment_path && <Button variant="ghost" size="sm" onClick={() => window.open(`/uploads/${slip.attachment_path}`, '_blank')}>View</Button>}
                </div>
            ))}
         </div>
      </div>

      <Modal isOpen={showCompModal} onClose={()=>setShowCompModal(false)} title="Add Company">
          <form onSubmit={handleAddCompany} className="space-y-4">
              <Input label="Company Name" value={compForm.name} onChange={e=>setCompForm({...compForm, name: e.target.value})} required/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Joining Date" type="date" value={compForm.joining_date} onChange={e=>setCompForm({...compForm, joining_date: e.target.value})} required/>
                  {!compForm.is_current && <Input label="Relieving Date" type="date" value={compForm.relieving_date} onChange={e=>setCompForm({...compForm, relieving_date: e.target.value})} />}
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
                  <select className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={slipForm.month} onChange={e=>setSlipForm({...slipForm, month: e.target.value})}>{['January','February','March','April','May','June','July','August','September','October','November','December'].map(m=><option key={m}>{m}</option>)}</select>
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