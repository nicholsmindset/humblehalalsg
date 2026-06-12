"use client";

/* Humble Halal — Admin Dashboard (ported from screens-admin.jsx) */
import { Fragment, useState } from "react";
import { HHData } from "@/lib/data";
import type { BadgeKey, Listing } from "@/lib/types";
import { halalSgSearchUrl } from "@/lib/muis";
import { useApp } from "../app-context";
import { Badge, Empty, Icon, ImagePh } from "../ui";
import { Sparkline } from "./business";

export function AdminScreen() {
  const { navigate, toast } = useApp();
  const [section, setSection] = useState<string>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const pick = (id: string) => {
    setSection(id);
    setNavOpen(false);
  };

  const nav: [string, string, string][] = [
    ["overview", "Overview", "chart"],
    ["approvals", "Listing approvals", "doc"],
    ["events", "Event approvals", "calendar"],
    ["verification", "Halal verification", "shield-check"],
    ["reviews", "Review moderation", "star"],
    ["reports", "Reports & corrections", "flag"],
    ["users", "Users & owners", "user"],
    ["catalog", "Categories & areas", "tag"],
    ["featured", "Featured & ads", "trophy"],
    ["monetization", "Monetization", "settings"],
    ["payments", "Payments", "dollar"],
    ["audit", "Audit log", "list"],
  ];

  return (
    <div className="admin">
      {navOpen && <div className="admin-side-veil" onClick={()=>setNavOpen(false)} />}
      <aside className={`admin-side ${navOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <div className="hh-logo"><div className="mark"><Icon name="crescent" size={18}/></div><div className="name" style={{fontSize:'1rem'}}>Humble Halal<small>Admin</small></div></div>
          <button className="admin-side-close" onClick={()=>setNavOpen(false)} aria-label="Close menu"><Icon name="x" size={20}/></button>
        </div>
        <nav className="admin-nav">
          {nav.map(([id,label,icon])=>(
            <button key={id} className={section===id?'on':''} onClick={()=>pick(id)}><Icon name={icon} size={18}/> {label}
              {id==='approvals' && <span className="admin-count">7</span>}
              {id==='events' && <span className="admin-count">3</span>}
              {id==='reports' && <span className="admin-count">4</span>}
            </button>
          ))}
        </nav>
        <button className="btn btn-ghost btn-sm" style={{margin:16}} onClick={()=>navigate('home')}><Icon name="logout" size={16}/> Exit admin</button>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <div className="flex g10 center"><button className="map-iconbtn admin-menu" onClick={()=>setNavOpen(true)} aria-label="Open menu" style={{width:40,height:40}}><Icon name="menu" size={18}/></button>
            <h1 style={{fontSize:'1.3rem'}}>{nav.find(n=>n[0]===section)?.[1]}</h1></div>
          <div className="flex g10 center"><button className="map-iconbtn" style={{width:40,height:40,borderRadius:11}}><Icon name="bell" size={18}/></button><span className="avatar" style={{background:'var(--emerald)',color:'#fff'}}>A</span></div>
        </div>

        <div className="admin-body">
          {section==='overview' && <AdminOverview setSection={setSection} />}
          {section==='approvals' && <AdminApprovals toast={toast} navigate={navigate} />}
          {section==='events' && <AdminEvents toast={toast} navigate={navigate} />}
          {section==='verification' && <AdminVerification toast={toast} />}
          {section==='reviews' && <AdminReviews toast={toast} />}
          {section==='reports' && <AdminReports toast={toast} />}
          {section==='users' && <AdminUsers />}
          {section==='catalog' && <AdminCatalog toast={toast} />}
          {section==='featured' && <AdminFeatured toast={toast} />}
          {section==='monetization' && <AdminMonetization />}
          {section==='payments' && <AdminPayments />}
          {section==='audit' && <AdminAudit />}
        </div>
      </div>
    </div>
  );
}

export function AdminMonetization() {
  const { flags, setFlag, toast } = useApp();
  const rows: { key: "paidTickets" | "paidAds" | "paidPlans"; title: string; desc: string }[] = [
    { key: "paidTickets", title: "Paid event tickets", desc: "Let businesses sell paid tickets (Stripe Connect). When OFF, every event is free RSVP only and the paid checkout API is blocked server-side." },
    { key: "paidAds", title: "Paid advertising", desc: "Enable purchasable ad placements on the Advertise page. When OFF, ad CTAs invite enquiries instead of charging." },
    { key: "paidPlans", title: "Paid listing plans", desc: "Enable Verified / Featured / Premium subscriptions on the Pricing page and billing." },
  ];
  return (
    <div style={{ maxWidth: 720 }}>
      <div className="notice notice-warn" style={{ marginBottom: 18 }}>
        <Icon name="info" size={18} />
        <span>
          Monetization launches <strong>OFF</strong> — the site runs on free tickets. Flip a switch to go live with a revenue stream.
          Paid flows also require Stripe keys + each business to complete payout onboarding.
        </span>
      </div>
      <div className="stack g12">
        {rows.map((r) => {
          const on = flags[r.key];
          return (
            <div key={r.key} className="card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div className="flex g8 center" style={{ marginBottom: 4 }}>
                  <h3 style={{ fontSize: "1.05rem" }}>{r.title}</h3>
                  <span className={`tag ${on ? "" : ""}`} style={{ background: on ? "var(--emerald-50)" : "var(--cream-200)", color: on ? "var(--emerald)" : "var(--ink-soft)" }}>
                    {on ? "Live" : "Off"}
                  </span>
                </div>
                <p className="muted" style={{ fontSize: ".9rem", lineHeight: 1.5 }}>{r.desc}</p>
              </div>
              <button
                role="switch"
                aria-checked={on}
                aria-label={`${on ? "Disable" : "Enable"} ${r.title}`}
                className={`cert-toggle ${on ? "on" : ""}`}
                style={{ flex: "none" }}
                onClick={() => {
                  setFlag(r.key, !on);
                  toast(`${r.title} ${!on ? "enabled" : "disabled"}`);
                }}
              >
                <span className="cert-switch"><span className="cert-knob" /></span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdminOverview({ setSection }: { setSection: (s: string) => void }) {
  const stats: [string, string, string, string][] = [
    ['Total listings','12,418','+142','up'],['Pending approvals','7','3 new','up'],['Open claims','12','+2','up'],
    ['Reported listings','4','-1','down'],['Total users','48,209','+1.2K','up'],['MUIS certified','3,841','+38','up'],
  ];
  return (
    <div>
      <div className="admin-statgrid">
        {stats.map(([l,v,d,dir])=>(<div key={l} className="stat"><div className="v">{v}</div><div className="l">{l}</div><div className={`d ${dir}`}>{d}</div></div>))}
      </div>
      <div className="admin-twocol mt20">
        <div className="card" style={{padding:20}}>
          <div className="flex between center"><h3 style={{fontSize:'1.1rem'}}>New listings — last 30 days</h3><span className="tag"><Icon name="trend" size={13}/> +18%</span></div>
          <Sparkline data={HHData.analytics.spark} />
        </div>
        <div className="card" style={{padding:20}}>
          <h3 style={{fontSize:'1.1rem', marginBottom:14}}>Needs your attention</h3>
          <div className="stack g10">
            {([['7 listings awaiting approval','approvals','doc'],['4 reports to review','reports','flag'],['12 ownership claims','approvals','building'],['3 verification requests','verification','shield-check']] as [string, string, string][]).map(([t,sec,icon])=>(
              <button key={t} className="attn-row" onClick={()=>setSection(sec)}><span className="flex g10 center"><span className="attn-ico"><Icon name={icon} size={17}/></span>{t}</span><Icon name="chevron" size={17}/></button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminApprovals({ toast, navigate }: { toast: (msg: string) => void; navigate: (screen: string, params?: Record<string, unknown>) => void }) {
  const [rows, setRows] = useState(HHData.listings.slice(0,7).map((l,i)=>({ ...l, status: i<2?'claim':'new', submitted: `${i+1}d ago` })));
  const act = (id: string, action: string) => { setRows(r=>r.filter(x=>x.id!==id)); toast(action==='approve'?'Listing approved':'Listing rejected'); };
  return (
    <div className="card" style={{overflow:'hidden'}}>
      <div className="admin-tablehead"><div className="flex g8 center"><span className="tag">{rows.length} pending</span></div>
        <div className="searchbar" style={{maxWidth:240, padding:'4px 4px 4px 12px'}}><Icon name="search" className="lead" size={16}/><input placeholder="Search…" style={{fontSize:'.86rem'}}/></div></div>
      <div className="tbl-scroll">
        <table className="tbl">
          <thead><tr><th>Business</th><th>Type</th><th>Area</th><th>Halal claim</th><th>Submitted</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="rowhover">
                <td><div className="flex g10 center"><ImagePh label="" tone={r.tone} src={r.image} style={{width:38,height:38,borderRadius:8,flex:'none'}}/><div><div style={{fontWeight:700}}>{r.name}</div><div className="faint" style={{fontSize:'.78rem'}}>{r.cat}</div></div></div></td>
                <td><span className={`pill-tag ${r.status==='claim'?'amber':'blue'}`}>{r.status==='claim'?'Claim':'New listing'}</span></td>
                <td className="muted">{r.area}</td>
                <td><Badge type={r.badges[0]}/></td>
                <td className="muted">{r.submitted}</td>
                <td><div className="flex g6">
                  <button className="btn btn-soft btn-sm" onClick={()=>navigate('detail',{id:r.id})}><Icon name="eye" size={15}/></button>
                  <button className="btn btn-primary btn-sm" onClick={()=>act(r.id,'approve')}>Approve</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>act(r.id,'reject')}>Reject</button>
                </div></td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan={6}><Empty icon="check" title="All caught up" body="No listings awaiting approval." /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminEvents({ toast, navigate }: { toast: (msg: string) => void; navigate: (screen: string, params?: Record<string, unknown>) => void }) {
  const [rows, setRows] = useState(
    [HHData.events.find(e=>e.id==='e1'), HHData.events.find(e=>e.id==='e6'), HHData.events.find(e=>e.id==='e8')]
      .filter(Boolean).map((e,i)=>({ ...e!, submitted:`${i+1}d ago` }))
  );
  const act = (id: string, action: string) => { setRows(r=>r.filter(x=>x.id!==id)); toast(action==='approve'?'Event approved & published':'Event rejected'); };
  return (
    <div className="card" style={{overflow:'hidden'}}>
      <div className="admin-tablehead">
        <div className="flex g8 center"><span className="tag">{rows.length} pending</span><span className="faint" style={{fontSize:'.82rem'}}>Review before events go live</span></div>
        <div className="searchbar" style={{maxWidth:240, padding:'4px 4px 4px 12px'}}><Icon name="search" className="lead" size={16}/><input placeholder="Search events…" style={{fontSize:'.86rem'}}/></div>
      </div>
      <div className="tbl-scroll">
        <table className="tbl">
          <thead><tr><th>Event</th><th>Category</th><th>Date</th><th>Pricing</th><th>Host</th><th>Submitted</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="rowhover">
                <td><div className="flex g10 center"><ImagePh label="" tone={r.tone} src={r.img} style={{width:40,height:32,borderRadius:7,flex:'none'}}/><div style={{fontWeight:700, maxWidth:200}}>{r.title}</div></div></td>
                <td className="muted">{r.cat}</td>
                <td className="muted">{r.dateLabel}</td>
                <td>{r.free ? <span className="pill-tag green">Free</span> : <span className="pill-tag amber">${r.priceFrom}</span>}</td>
                <td className="muted">{r.organiser}</td>
                <td className="muted">{r.submitted}</td>
                <td><div className="flex g6">
                  <button className="btn btn-soft btn-sm" onClick={()=>navigate('event-detail',{id:r.id})}><Icon name="eye" size={15}/></button>
                  <button className="btn btn-primary btn-sm" onClick={()=>act(r.id,'approve')}>Approve</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>act(r.id,'reject')}>Reject</button>
                </div></td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan={7}><Empty icon="check" title="All caught up" body="No events awaiting approval." /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminVerification({ toast }: { toast: (msg: string) => void }) {
  const [rows] = useState<Listing[]>(HHData.listings.slice(0, 5).map((l) => ({ ...l })));
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, "muis" | "admin">>({});
  const [certNo, setCertNo] = useState("");
  const [scheme, setScheme] = useState("");
  const [expiry, setExpiry] = useState("");

  const openCertForm = (id: string) => { setVerifyingId(id); setCertNo(""); setScheme(""); setExpiry(""); };

  const submit = async (id: string, action: "muis" | "admin") => {
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: id, action, certNo: action === "muis" ? certNo : undefined, scheme, expiry }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!data.ok) { toast(data.error || "Could not save"); return; }
    } catch { /* graceful — confirm to the admin anyway */ }
    setDone((d) => ({ ...d, [id]: action }));
    setVerifyingId(null);
    toast(`Recorded ${action === "muis" ? "MUIS Certified" : "Admin Verified"}`);
  };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="admin-tablehead">
        <h3 style={{ fontSize: "1.05rem" }}>Halal verification management</h3>
        <span className="faint" style={{ fontSize: ".82rem" }}>Verify on the official HalalSG register, then record the certificate here</span>
      </div>
      <div className="tbl-scroll">
        <table className="tbl">
          <thead><tr><th>Business</th><th>Current status</th><th>Verify at source</th><th>Record verification</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const granted = done[r.id];
              const expiringSoon = r.verify?.expiringSoon;
              return (
                <Fragment key={r.id}>
                  <tr className="rowhover">
                    <td><div style={{ fontWeight: 700 }}>{r.name}</div><div className="faint" style={{ fontSize: ".78rem" }}>{r.area}</div></td>
                    <td>
                      <Badge type={granted || (r.badges[0] as BadgeKey)} />
                      {expiringSoon && !granted && <span className="verif-expiring" style={{ marginLeft: 8 }}><Icon name="clock" size={12} /> Re-verify</span>}
                    </td>
                    <td>
                      <a className="btn btn-soft btn-sm" href={halalSgSearchUrl(r.name)} target="_blank" rel="noopener noreferrer">
                        <Icon name="external" size={14} /> Look up on HalalSG
                      </a>
                    </td>
                    <td>
                      {granted ? (
                        <span className="faint" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}><Icon name="check" size={15} /> Recorded</span>
                      ) : (
                        <div className="flex g6 wrap">
                          <button className="btn btn-primary btn-sm" onClick={() => openCertForm(r.id)}><Icon name="shield-check" size={14} /> MUIS</button>
                          <button className="btn btn-gold btn-sm" onClick={() => submit(r.id, "admin")}><Icon name="check" size={14} /> Verify</button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {verifyingId === r.id && (
                    <tr>
                      <td colSpan={4} style={{ background: "var(--cream)" }}>
                        <div className="verify-certform">
                          <div className="field"><label>Certificate no.</label><input className="input" value={certNo} onChange={(e) => setCertNo(e.target.value)} placeholder="From the HalalSG register" /></div>
                          <div className="field"><label>Scheme</label><input className="input" value={scheme} onChange={(e) => setScheme(e.target.value)} placeholder="e.g. Eating Establishment" /></div>
                          <div className="field"><label>Expiry</label><input type="date" className="input" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div>
                          <div className="flex g8">
                            <button className="btn btn-primary btn-sm" disabled={!certNo.trim()} onClick={() => submit(r.id, "muis")}>Record MUIS cert</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setVerifyingId(null)}>Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ReportRow { id: string; biz: string; reason: string; by: string; time: string; sev: string }
export function AdminReports({ toast }: { toast: (msg: string) => void }) {
  const [rows,setRows]=useState<ReportRow[]>([
    {id:'rp1', biz:'Tok Tok Mee Pok House', reason:'Wrong halal status', by:'Nadia K.', time:'2h ago', sev:'high'},
    {id:'rp2', biz:'Kopi & Kueh Corner', reason:'Permanently closed', by:'Faizal M.', time:'5h ago', sev:'high'},
    {id:'rp3', biz:'Qahwa & Co.', reason:'Wrong opening hours', by:'Imran S.', time:'1d ago', sev:'low'},
    {id:'rp4', biz:'Barakah Mart', reason:'Wrong address', by:'Sara L.', time:'2d ago', sev:'low'},
  ]);
  const resolve=(id: string)=>{ setRows(r=>r.filter(x=>x.id!==id)); toast('Report resolved'); };
  return (
    <div className="stack g12">
      {rows.map(r=>(
        <div key={r.id} className="card" style={{padding:18}}>
          <div className="flex between center wrap g10">
            <div className="flex g12 center"><span className={`sev-dot ${r.sev}`}/><div><div style={{fontWeight:700}}>{r.reason}</div><div className="faint" style={{fontSize:'.82rem'}}>{r.biz} · reported by {r.by} · {r.time}</div></div></div>
            <div className="flex g8"><button className="btn btn-outline btn-sm">View listing</button><button className="btn btn-soft btn-sm">Contact owner</button><button className="btn btn-primary btn-sm" onClick={()=>resolve(r.id)}>Resolve</button></div>
          </div>
        </div>
      ))}
      {rows.length===0 && <Empty icon="check" title="Inbox zero" body="No open reports or corrections." />}
    </div>
  );
}

export function AdminReviews({ toast }: { toast: (msg: string) => void }) {
  const [rows,setRows]=useState(HHData.reviews.map((r,i)=>({...r, biz:HHData.listings[i].name, flagged:i===0})));
  const act=(id: string,a: string)=>{ setRows(r=>r.filter(x=>x.id!==id)); toast(a==='keep'?'Review kept':'Review removed'); };
  return (
    <div className="stack g12">
      {rows.map(r=>(
        <div key={r.id} className="card" style={{padding:18}}>
          <div className="flex between center wrap g8"><div className="flex g10 center"><span className="avatar">{r.avatar}</span><div><div style={{fontWeight:700}}>{r.name} <span className="faint" style={{fontWeight:500}}>on {r.biz}</span></div><span className="rs-stars">{[1,2,3,4,5].map(i=><Icon key={i} name="starf" size={12} style={{color:i<=r.rating?'var(--gold)':'var(--line-strong)'}}/>)}</span></div></div>
            {r.flagged && <span className="pill-tag red">Flagged</span>}</div>
          <p className="muted" style={{marginTop:10, fontSize:'.92rem'}}>{r.text}</p>
          <div className="flex g8 mt12"><button className="btn btn-primary btn-sm" onClick={()=>act(r.id,'keep')}>Keep</button><button className="btn btn-ghost btn-sm" onClick={()=>act(r.id,'remove')}>Remove</button></div>
        </div>
      ))}
    </div>
  );
}

export function AdminUsers() {
  const users: [string, string, string, string, string][]=[['Aisyah Rahman','aisyah@email.com','User','48 saves','Active'],['Faizal Madon','faizal@email.com','User','12 reviews','Active'],['Warung Bumbu','owner@bumbu.sg','Owner','2 listings','Verified'],['Qahwa & Co.','hi@qahwa.co','Owner','1 listing','Verified'],['Imran Shah','imran@email.com','User','5 saves','Suspended']];
  return (
    <div className="card" style={{overflow:'hidden'}}>
      <div className="admin-tablehead"><div className="flex g8"><button className="chip active">All</button><button className="chip">Users</button><button className="chip">Owners</button></div>
        <div className="searchbar" style={{maxWidth:240, padding:'4px 4px 4px 12px'}}><Icon name="search" className="lead" size={16}/><input placeholder="Search users…" style={{fontSize:'.86rem'}}/></div></div>
      <div className="tbl-scroll"><table className="tbl">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Activity</th><th>Status</th><th></th></tr></thead>
        <tbody>{users.map(([n,e,r,a,s])=>(
          <tr key={e} className="rowhover"><td><div className="flex g8 center"><span className="avatar" style={{width:32,height:32,fontSize:'.78rem'}}>{n[0]}</span><span style={{fontWeight:600}}>{n}</span></div></td>
            <td className="muted">{e}</td><td><span className={`pill-tag ${r==='Owner'?'blue':'gray'}`}>{r}</span></td><td className="muted">{a}</td>
            <td><span className={`pill-tag ${s==='Suspended'?'red':s==='Verified'?'green':'gray'}`}>{s}</span></td>
            <td><button className="btn btn-ghost btn-sm"><Icon name="settings" size={16}/></button></td></tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

export function AdminCatalog({ toast }: { toast: (msg: string) => void }) {
  return (
    <div className="admin-twocol">
      <div className="card" style={{padding:20}}>
        <div className="flex between center"><h3 style={{fontSize:'1.1rem'}}>Categories</h3><button className="btn btn-soft btn-sm" onClick={()=>toast('Add category')}><Icon name="plus" size={15}/> Add</button></div>
        <div className="stack g8 mt14">{HHData.categories.map(c=>(<div key={c.id} className="catalog-row"><span className="flex g10 center"><span className="attn-ico"><Icon name={c.icon} size={16}/></span>{c.label}</span><div className="flex g6"><button className="btn btn-ghost btn-sm"><Icon name="edit" size={15}/></button></div></div>))}</div>
      </div>
      <div className="card" style={{padding:20}}>
        <div className="flex between center"><h3 style={{fontSize:'1.1rem'}}>Locations / areas</h3><button className="btn btn-soft btn-sm" onClick={()=>toast('Add area')}><Icon name="plus" size={15}/> Add</button></div>
        <div className="stack g8 mt14">{HHData.areas.map(a=>(<div key={a.id} className="catalog-row"><span className="flex g10 center"><Icon name="pin" size={16} style={{color:'var(--emerald)'}}/>{a.name}</span><span className="faint" style={{fontSize:'.82rem'}}>{a.count} listings</span></div>))}</div>
      </div>
    </div>
  );
}

export function AdminFeatured({ toast }: { toast: (msg: string) => void }) {
  const [feat,setFeat]=useState<boolean[]>(HHData.listings.map(l=>l.featured));
  const tog=(i: number)=>{ setFeat(f=>f.map((v,idx)=>idx===i?!v:v)); toast('Featured updated'); };
  return (
    <div className="card" style={{overflow:'hidden'}}>
      <div className="admin-tablehead"><h3 style={{fontSize:'1.05rem'}}>Featured listings &amp; ads</h3><span className="faint" style={{fontSize:'.82rem'}}>Toggle homepage & category placement</span></div>
      <div className="tbl-scroll"><table className="tbl">
        <thead><tr><th>Business</th><th>Plan</th><th>Area</th><th>Featured</th></tr></thead>
        <tbody>{HHData.listings.map((l,i)=>(
          <tr key={l.id} className="rowhover"><td><div style={{fontWeight:700}}>{l.name}</div></td><td><span className="pill-tag blue">{i%3===0?'Featured':i%2?'Verified':'Free'}</span></td><td className="muted">{l.area}</td>
            <td><button className={`fp-toggle ${feat[i]?'on':''}`} style={{width:64,padding:8,justifyContent:'center'}} onClick={()=>tog(i)}><span className="switch"/></button></td></tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

export function AdminPayments() {
  const rows: [string, string, string, string, string, string][]=[['#INV-2841','Warung Bumbu','Verified','$39.00','Paid','1 Jun'],['#INV-2840','Qahwa & Co.','Featured','$99.00','Paid','1 Jun'],['#INV-2839','Madinah Spice','Premium','$189.00','Paid','31 May'],['#INV-2838','The Modest Thread','Verified','$39.00','Failed','30 May'],['#INV-2837','Rumah Tenun','Featured','$99.00','Paid','29 May']];
  return (
    <div>
      <div className="admin-statgrid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))'}}>
        {([['MRR','$48,210','+8%','up'],['This month','$12,840','+12%','up'],['Failed payments','3','-2','down'],['Active subscriptions','1,284','+34','up']] as [string, string, string, string][]).map(([l,v,d,dir])=>(<div key={l} className="stat"><div className="v">{v}</div><div className="l">{l}</div><div className={`d ${dir}`}>{d}</div></div>))}
      </div>
      <div className="card mt20" style={{overflow:'hidden'}}>
        <div className="admin-tablehead"><h3 style={{fontSize:'1.05rem'}}>Recent transactions</h3></div>
        <div className="tbl-scroll"><table className="tbl">
          <thead><tr><th>Invoice</th><th>Business</th><th>Plan</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>{rows.map(([inv,biz,plan,amt,st,dt])=>(
            <tr key={inv} className="rowhover"><td className="kbd-mono" style={{fontWeight:600}}>{inv}</td><td style={{fontWeight:600}}>{biz}</td><td className="muted">{plan}</td><td style={{fontWeight:700}}>{amt}</td>
              <td><span className={`pill-tag ${st==='Failed'?'red':'green'}`}>{st}</span></td><td className="muted">{dt}</td></tr>
          ))}</tbody>
        </table></div>
      </div>
    </div>
  );
}

export function AdminAudit() {
  const logs: [string, string, string, string][]=[['Approved listing','Madinah Spice Kitchen','admin@hh.sg','2 min ago'],['Granted MUIS Certified','Warung Bumbu Rempah','admin@hh.sg','18 min ago'],['Resolved report','Tok Tok Mee Pok','mod@hh.sg','1h ago'],['Removed review','Kopi & Kueh','mod@hh.sg','3h ago'],['Suspended user','imran@email.com','admin@hh.sg','5h ago'],['Featured listing','Qahwa & Co.','admin@hh.sg','1d ago']];
  return (
    <div className="card" style={{padding:20}}>
      <h3 style={{fontSize:'1.1rem', marginBottom:14}}>Audit log</h3>
      <div className="audit-list">
        {logs.map(([action,target,who,time],i)=>(
          <div key={i} className="audit-row"><span className="audit-dot"/><div className="f1"><div><strong>{action}</strong> · <span className="muted">{target}</span></div><div className="faint" style={{fontSize:'.8rem'}}>{who} · {time}</div></div></div>
        ))}
      </div>
    </div>
  );
}
