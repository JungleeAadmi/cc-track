import React, { useEffect, useState } from 'react';
import api from '../api';
import { Button, Input, FileInput } from '../components/ui';
import Modal from '../components/Modal';
import VirtualCard from '../components/VirtualCard';
import useLongPress from '../hooks/useLongPress';
import { Plus, Eye, RotateCw, FileText, CheckCircle } from 'lucide-react';

// --- Card Detail & Statement Modal ---
const CardDetailModal = ({ card, isOpen, onClose, onRefresh }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // details | statements
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAddStmtModal, setShowAddStmtModal] = useState(false);
  const [selectedStmt, setSelectedStmt] = useState(null);

  // Forms
  const [stmtForm, setStmtForm] = useState({ month: '', generated_date: '', due_date: '', total_due: '', min_due: '' });
  const [stmtFile, setStmtFile] = useState(null);
  const [payForm, setPayForm] = useState({ paid_amount: '', payment_ref: '' });

  if (!isOpen || !card) return null;

  const handleAddStatement = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(stmtForm).forEach(k => formData.append(k, stmtForm[k]));
    if(stmtFile) formData.append('attachment', stmtFile);
    
    await api.post(`/api/cards/${card.id}/statements`, formData);
    setShowAddStmtModal(false);
    onRefresh();
  };

  const handlePay = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('paid_amount', payForm.paid_amount);
    formData.append('payment_ref', payForm.payment_ref);
    
    await api.post(`/api/cards/statements/${selectedStmt.id}/pay`, formData);
    setShowPayModal(false);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-lg h-[90vh] flex flex-col relative bg-surface border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex justify-between p-4 border-b border-white/10">
                <h3 className="font-bold text-white">{card.name}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white">Close</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* 3D Flip Card */}
                <div className="perspective-1000 w-full aspect-[1.58/1] cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
                    <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                        <div className="absolute inset-0 backface-hidden">
                            <VirtualCard card={card} />
                        </div>
                        <div className="absolute inset-0 backface-hidden rotate-y-180 h-full w-full bg-slate-900 rounded-2xl border border-white/20 flex flex-col justify-center items-center shadow-2xl relative overflow-hidden">
                            {/* Magnetic Strip */}
                            <div className="w-full h-12 bg-black mt-6 absolute top-0 left-0"></div>
                            
                            <div className="w-full px-8 mt-4">
                                <div className="w-full h-10 bg-white/10 flex items-center justify-end px-4">
                                    <span className="font-mono text-xl tracking-widest text-black bg-white px-2 rounded-sm transform -skew-x-12">{card.cvv || '***'}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1 text-right mr-1">CVV</div>
                            </div>

                            <div className="mt-auto mb-6 flex gap-4">
                                {card.back_image_path && <img src={`/uploads/${card.back_image_path}`} className="h-16 rounded border border-white/20"/>}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-center text-xs text-slate-500 flex justify-center gap-2">
                    <RotateCw size={12}/> Tap to see CVV
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('details')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${activeTab === 'details' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Details</button>
                    <button onClick={() => setActiveTab('statements')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${activeTab === 'statements' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Statements</button>
                </div>

                {/* Tab Content */}
                {activeTab === 'details' ? (
                     <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                            <div><p className="text-slate-500">Total Limit</p><p className="text-lg font-bold text-white">₹{card.limit.toLocaleString()}</p></div>
                            <div><p className="text-slate-500">Network</p><p className="text-white">{card.card_network} {card.card_type}</p></div>
                            <div><p className="text-slate-500">Statement Date</p><p className="text-white">{card.statement_date ? `${card.statement_date}th of month` : 'N/A'}</p></div>
                            <div><p className="text-slate-500">Payment Due</p><p className="text-white">{card.payment_due_date ? `${card.payment_due_date}th of month` : 'N/A'}</p></div>
                        </div>
                        {card.front_image_path && (
                            <div>
                                <p className="text-xs text-slate-500 mb-2">Card Image</p>
                                <img src={`/uploads/${card.front_image_path}`} className="w-full rounded-xl border border-white/10"/>
                            </div>
                        )}
                     </div>
                ) : (
                    <div className="space-y-3">
                        <Button size="sm" className="w-full" onClick={()=>setShowAddStmtModal(true)}><Plus size={16}/> Record New Statement</Button>
                        
                        {card.statements?.length === 0 && <p className="text-center text-slate-500 py-4">No statements recorded</p>}
                        
                        {card.statements?.slice().reverse().map(st => (
                            <div key={st.id} className="bg-black/20 p-3 rounded-xl border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-white">{st.month}</p>
                                        <p className="text-xs text-slate-400">Due: {new Date(st.due_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-white">₹{st.total_due.toLocaleString()}</p>
                                        {st.is_paid ? (
                                            <span className="text-[10px] text-green-400 flex items-center gap-1 justify-end"><CheckCircle size={10}/> Paid</span>
                                        ) : (
                                            <span className="text-[10px] text-red-400">Unpaid</span>
                                        )}
                                    </div>
                                </div>
                                {!st.is_paid && (
                                    <Button size="sm" variant="secondary" className="w-full h-8 text-xs" onClick={()=>{setSelectedStmt(st); setPayForm({...payForm, paid_amount: st.total_due}); setShowPayModal(true);}}>
                                        Mark Paid
                                    </Button>
                                )}
                                {st.attachment_path && (
                                    <button onClick={()=>window.open(`/uploads/${st.attachment_path}`,'_blank')} className="text-[10px] text-primary underline mt-2 flex items-center gap-1"><FileText size={10}/> View PDF</button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Nested Modals (Using absolute positioning to stay inside logic) */}
            {showAddStmtModal && (
                <div className="absolute inset-0 bg-surface z-20 p-4">
                     <h3 className="font-bold mb-4">Add Statement</h3>
                     <form onSubmit={handleAddStatement} className="space-y-3">
                         <Input label="Month" placeholder="e.g. Jan 2024" value={stmtForm.month} onChange={e=>setStmtForm({...stmtForm, month: e.target.value})} required/>
                         <Input label="Generated Date" type="date" value={stmtForm.generated_date} onChange={e=>setStmtForm({...stmtForm, generated_date: e.target.value})} required/>
                         <Input label="Due Date" type="date" value={stmtForm.due_date} onChange={e=>setStmtForm({...stmtForm, due_date: e.target.value})} required/>
                         <Input label="Total Due" type="number" value={stmtForm.total_due} onChange={e=>setStmtForm({...stmtForm, total_due: e.target.value})} required/>
                         <Input label="Min Due" type="number" value={stmtForm.min_due} onChange={e=>setStmtForm({...stmtForm, min_due: e.target.value})}/>
                         <FileInput label="Statement PDF" onChange={e=>setStmtFile(e.target.files[0])}/>
                         <div className="flex gap-2">
                             <Button type="submit" className="flex-1">Save</Button>
                             <Button type="button" variant="ghost" className="flex-1" onClick={()=>setShowAddStmtModal(false)}>Cancel</Button>
                         </div>
                     </form>
                </div>
            )}
            
            {showPayModal && (
                <div className="absolute inset-0 bg-surface z-20 p-4 flex flex-col justify-center">
                    <h3 className="font-bold mb-4">Record Payment</h3>
                    <form onSubmit={handlePay} className="space-y-4">
                        <Input label="Amount Paid" type="number" value={payForm.paid_amount} onChange={e=>setPayForm({...payForm, paid_amount: e.target.value})}/>
                        <Input label="Ref Number (Optional)" value={payForm.payment_ref} onChange={e=>setPayForm({...payForm, payment_ref: e.target.value})}/>
                        <div className="flex gap-2">
                             <Button type="submit" className="flex-1">Confirm Payment</Button>
                             <Button type="button" variant="ghost" className="flex-1" onClick={()=>setShowPayModal(false)}>Cancel</Button>
                         </div>
                    </form>
                </div>
            )}
        </div>
    </div>
  );
};

const Cards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [actionCard, setActionCard] = useState(null);
  
  const initialForm = {
    name: '', bank_name: '', card_network: 'Visa', card_type: 'Credit',
    card_number: '', cvv: '', expiry_date: '', owner_name: '',
    limit: '', statement_date: '', payment_due_date: '', color_theme: 'gradient-1'
  };
  const [form, setForm] = useState(initialForm);
  const [frontImg, setFrontImg] = useState(null);
  const [backImg, setBackImg] = useState(null);

  useEffect(() => { fetchCards(); }, []);
  const fetchCards = async () => { try { const res = await api.get('/api/cards/'); setCards(res.data); } catch (e) {} };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    if (frontImg) formData.append('front_image', frontImg);
    if (backImg) formData.append('back_image', backImg);

    try {
      await api.post('/api/cards/', formData);
      setShowAddModal(false); setForm(initialForm); setFrontImg(null); setBackImg(null);
      fetchCards();
    } catch (err) { alert("Failed. Check inputs/size."); } 
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
     if(actionCard && confirm("Delete?")) { await api.delete(`/api/cards/${actionCard.id}`); fetchCards(); setActionCard(null); }
  };

  const longPressProps = useLongPress(
    (e) => { const c = cards.find(i => i.id == e.target.closest('[data-card-id]')?.dataset.cardId); if(c) setActionCard(c); },
    (e) => { const c = cards.find(i => i.id == e.target.closest('[data-card-id]')?.dataset.cardId); if(c) setSelectedCard(c); },
    { delay: 600, shouldPreventDefault: true }
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Wallet</h2>
        <Button onClick={() => setShowAddModal(true)} className="rounded-full w-10 h-10 p-0 flex items-center justify-center"><Plus size={24}/></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
            <div key={card.id} data-card-id={card.id} {...longPressProps} className="relative touch-manipulation">
                <VirtualCard card={card} />
            </div>
        ))}
      </div>

      <CardDetailModal card={selectedCard} isOpen={!!selectedCard} onClose={()=>setSelectedCard(null)} onRefresh={fetchCards}/>

      {/* Action Menu for Long Press */}
      {actionCard && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60" onClick={()=>setActionCard(null)}>
              <div className="bg-surface w-full max-w-sm rounded-xl overflow-hidden" onClick={e=>e.stopPropagation()}>
                  <button onClick={handleDelete} className="w-full p-4 text-left text-red-400 border-b border-white/5">Delete Card</button>
                  <button onClick={()=>setActionCard(null)} className="w-full p-4 text-center text-slate-500">Cancel</button>
              </div>
          </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Card">
         <form onSubmit={handleCreate} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <Input label="Nick Name" placeholder="HDFC Regalia" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required />
                <Input label="Bank Name" placeholder="HDFC" value={form.bank_name} onChange={e=>setForm({...form, bank_name: e.target.value})} required />
            </div>
            <Input label="Card Number (16 Digits)" maxLength="19" placeholder="XXXX XXXX XXXX XXXX" value={form.card_number} onChange={e=>setForm({...form, card_number: e.target.value})} required />
            
            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1"><Input label="CVV" maxLength="4" value={form.cvv} onChange={e=>setForm({...form, cvv: e.target.value})} /></div>
                <div className="col-span-2"><Input label="Expiry (MM/YY)" value={form.expiry_date} onChange={e=>setForm({...form, expiry_date: e.target.value})} required /></div>
            </div>

            <Input label="Owner Name" value={form.owner_name} onChange={e=>setForm({...form, owner_name: e.target.value})} required />
            <Input label="Total Limit" type="number" value={form.limit} onChange={e=>setForm({...form, limit: e.target.value})} required />
            
            <div className="grid grid-cols-2 gap-4">
                <Input label="Statement Day" type="number" max="31" placeholder="e.g. 15" value={form.statement_date} onChange={e=>setForm({...form, statement_date: e.target.value})} />
                <Input label="Payment Due Day" type="number" max="31" placeholder="e.g. 5" value={form.payment_due_date} onChange={e=>setForm({...form, payment_due_date: e.target.value})} />
            </div>
            
             <div className="grid grid-cols-2 gap-4">
                <select className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={form.card_network} onChange={e=>setForm({...form, card_network: e.target.value})}><option>Visa</option><option>Mastercard</option><option>RuPay</option><option>Amex</option></select>
                <select className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={form.card_type} onChange={e=>setForm({...form, card_type: e.target.value})}><option>Credit</option><option>Debit</option></select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
                <FileInput label="Front Photo" onChange={e=>setFrontImg(e.target.files[0])} accept="image/*" />
                <FileInput label="Back Photo" onChange={e=>setBackImg(e.target.files[0])} accept="image/*" />
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>Save Card</Button>
         </form>
      </Modal>
    </div>
  );
};

export default Cards;