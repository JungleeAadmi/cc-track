import React, { useEffect, useState } from 'react';
import api from '../api';
import { Button, Input, FileInput } from '../components/ui';
import Modal from '../components/Modal';
import { Plus, Briefcase, FileText, Pencil, Trash2 } from 'lucide-react';
import FilePreviewModal from '../components/FilePreviewModal';

const Salary = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [salaries, setSalaries] = useState([]);
  
  const [showCompModal, setShowCompModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
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

    try {
        if(isEditing) await api.put(`/api/salary/companies/${editId}`, formData);
        else await api.post('/api/salary/companies', formData);
        setShowCompModal(false); setCompForm({ name: '', joining_date: '', relieving_date: '', is_current: false }); setCompLogo(null); setIsEditing(false); setEditId(null);
        fetchCompanies();
    } catch(e) { alert("Failed"); } finally { setLoading(false); }
  };
  
  const handleEdit = (c) => {
      setCompForm({
          name: c.name,
          joining_date: c.joining_date.split('T')[0],
          relieving_date: c.relieving_date ? c.relieving_date.split('T')[0] : '',
          is_current: c.is_current
      });
      setEditId(c.id); setIsEditing(true); setShowCompModal(true);
  };

  const handleDelete = async (id) => { if(confirm("Delete company?")) { await api.delete(`/api/salary/companies/${id}`); fetchCompanies(); }};

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

    try { await api.post('/api/salary/slips', formData); setShowSlipModal(false); fetchSalaries(selectedCompany.id); } 
    catch(e) { alert("Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex-none">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Work History</h2>
            <Button size="sm" onClick={() => {setIsEditing(false); setCompForm({name:'',joining_date:'',relieving_date:'',is_current:false}); setShowCompModal(true)}}><Plus size={18}/> Company</Button>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
            {companies.map(comp => (
                <div key={comp.id} className={`flex-none w-64 p-4 rounded-xl border relative ${selectedCompany?.id === comp.id ? 'bg-primary/20 border-primary shadow-lg' : 'bg-surface border-white/5'}`}>
                    <div className="absolute top-2 right-2 flex gap-1">
                        <button onClick={(e)=>{e.stopPropagation(); handleEdit(comp)}} className="p-1 bg-black/40 rounded text-white"><Pencil size={12}/></button>
                        <button onClick={(e)=>{e.stopPropagation(); handleDelete(comp.id)}} className="p-1 bg-red-900/40 rounded text-red-400"><Trash2 size={12}/></button>
                    </div>
                    <div onClick={() => setSelectedCompany(comp)} className="flex items-center gap-3 mb-3 cursor-pointer">
                        {comp.logo_path ? <img src={`/uploads/${comp.logo_path}`} className="w-10 h-10 rounded-full object-cover bg-white"/> : <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center"><Briefcase size={20}/></div>}
                        <div><h3 className="font-bold text-white truncate w-32">{comp.name}</h3><p className="text-[10px] text-slate-400">{new Date(comp.joining_date).getFullYear()} - {comp.is_current ? 'Present' : new Date(comp.relieving_date).getFullYear()}</p></div>
                    </div>
                </div>
            ))}
        </div>
      </div>
      
      <FilePreviewModal isOpen={!!previewFile} fileUrl={previewFile} onClose={()=>setPreviewFile(null)} title="Salary Slip" />

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
                    {slip.attachment_path && <Button variant="ghost" size="sm" onClick={() => setPreviewFile(`/uploads/${slip.attachment_path}`)}>View</Button>}
                </div>
            ))}
         </div>
      </div>

      <Modal isOpen={showCompModal} onClose={()=>setShowCompModal(false)} title={isEditing ? "Edit Company" : "Add Company"}>
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
              <Button type="submit" className="w-full" isLoading={loading}>{isEditing ? "Update" : "Save"}</Button>
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