import { useState, useEffect } from "react";

const PRESET_COLORS = [
  "#4A90D9","#E8734A","#7BBF6A","#D9784A","#9B7BC4",
  "#E84A8A","#4AC4C4","#C4A84A","#4AE87A","#FF6B6B"
];
const DEFAULT_CATEGORIES = [
  { id:1, name:"仕事",       color:"#4A90D9" },
  { id:2, name:"プライベート", color:"#E8734A" },
  { id:3, name:"勉強",       color:"#7BBF6A" },
  { id:4, name:"健康",       color:"#D9784A" },
  { id:5, name:"その他",     color:"#9B7BC4" },
];
const DAY_TYPES = [
  { key:"work",    label:"出勤", emoji:"💼", color:"#4A90D9", bg:"rgba(74,144,217,0.18)" },
  { key:"off",     label:"週休", emoji:"🌿", color:"#7BBF6A", bg:"rgba(123,191,106,0.18)" },
  { key:"holiday", label:"年休", emoji:"🌴", color:"#E8734A", bg:"rgba(232,115,74,0.18)" },
];
const DAYS_JP = ["日","月","火","水","木","金","土"];

function pad(n){ return String(n).padStart(2,"0"); }
function daysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function firstDay(y,m){ return new Date(y,m,1).getDay(); }
function toDateStr(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }

const defaultEvents = [
  { id:1, title:"チームミーティング", date:"2026-06-10", time:"10:00", categoryId:1, note:"週次進捗確認" },
  { id:2, title:"ランチ会",           date:"2026-06-12", time:"12:00", categoryId:2, note:"" },
  { id:3, title:"英語レッスン",       date:"2026-06-15", time:"19:00", categoryId:3, note:"Unit 5まで" },
  { id:4, title:"健康診断",           date:"2026-06-18", time:"09:00", categoryId:4, note:"" },
];

/* ─── tiny shared styles ─── */
const S = {
  input: {
    width:"100%", padding:"12px 14px", borderRadius:12,
    border:"1px solid rgba(255,255,255,0.15)",
    background:"rgba(255,255,255,0.08)", color:"#fff",
    fontSize:16, outline:"none", boxSizing:"border-box",
    fontFamily:"inherit", marginBottom:14,
    WebkitAppearance:"none",
  },
  label: {
    fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)",
    letterSpacing:"0.09em", textTransform:"uppercase", marginBottom:6, display:"block",
  },
  pill: (active, color) => ({
    padding:"8px 16px", borderRadius:20, border:"none",
    background: active ? (color||"rgba(102,126,234,0.85)") : "rgba(255,255,255,0.09)",
    color:"#fff", cursor:"pointer", fontSize:14, fontWeight: active?700:400,
    WebkitTapHighlightColor:"transparent",
  }),
  btn: (primary) => ({
    flex:1, padding:"15px 0", borderRadius:14, border:"none",
    background: primary ? "linear-gradient(135deg,#667eea,#764ba2)" : "rgba(255,255,255,0.09)",
    color:"#fff", cursor:"pointer", fontSize:15, fontWeight: primary?700:500,
    WebkitTapHighlightColor:"transparent",
  }),
};

export default function App() {
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [yr,  setYr]  = useState(today.getFullYear());
  const [mo,  setMo]  = useState(today.getMonth());
  const [view, setView] = useState("cal"); // cal | list | cat
  const [events,     setEvents]     = useState(() =>
    JSON.parse(localStorage.getItem("events") || "null") ?? defaultEvents);
  const [categories, setCategories] = useState(() =>
    JSON.parse(localStorage.getItem("categories") || "null") ?? DEFAULT_CATEGORIES);
  const [dayTypes,   setDayTypes]   = useState(() =>
    JSON.parse(localStorage.getItem("dayTypes") || "{}"));
  const [filterCat,  setFilterCat]  = useState(0);

  // event modal
  const [showEv,    setShowEv]    = useState(false);
  const [editingEv, setEditingEv] = useState(null);
  const [selDate,   setSelDate]   = useState(todayStr);
  const [evForm,    setEvForm]    = useState({ title:"", time:"09:00", categoryId:1, note:"" });

  // copy modal
  const [showCopy,  setShowCopy]  = useState(false);
  const [copyEv,    setCopyEv]    = useState(null);
  const [copyDest,  setCopyDest]  = useState(todayStr);

  // category modal
  const [showCat,   setShowCat]   = useState(false);
  const [editingCat,setEditingCat]= useState(null); // null=new
  const [catForm,   setCatForm]   = useState({ name:"", color:PRESET_COLORS[0] });

  function getCat(id){ return categories.find(c=>c.id===id)||{name:"?",color:"#888"}; }

  /* persist to localStorage */
  useEffect(() => { localStorage.setItem("events",     JSON.stringify(events));     }, [events]);
  useEffect(() => { localStorage.setItem("categories", JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem("dayTypes",   JSON.stringify(dayTypes));   }, [dayTypes]);

  /* nav */
  function prevMo(){ if(mo===0){setMo(11);setYr(y=>y-1);}else setMo(m=>m-1); }
  function nextMo(){ if(mo===11){setMo(0);setYr(y=>y+1);}else setMo(m=>m+1); }

  /* day type */
  function cycleDT(ds,e){
    e.stopPropagation();
    setDayTypes(prev=>{
      const keys = DAY_TYPES.map(d=>d.key);
      const idx  = keys.indexOf(prev[ds]);
      if(idx===-1) return {...prev,[ds]:"work"};
      if(idx===keys.length-1){ const n={...prev}; delete n[ds]; return n; }
      return {...prev,[ds]:keys[idx+1]};
    });
  }

  /* event CRUD */
  function openNew(date){
    setSelDate(date); setEditingEv(null);
    setEvForm({ title:"", time:"09:00", categoryId:categories[0]?.id||1, note:"" });
    setShowEv(true);
  }
  function openEdit(ev,e){
    e.stopPropagation();
    setEditingEv(ev); setSelDate(ev.date);
    setEvForm({ title:ev.title, time:ev.time, categoryId:ev.categoryId, note:ev.note });
    setShowEv(true);
  }
  function saveEv(){
    if(!evForm.title.trim()) return;
    if(editingEv) setEvents(es=>es.map(e=>e.id===editingEv.id?{...e,...evForm}:e));
    else          setEvents(es=>[...es,{id:Date.now(),date:selDate,...evForm}]);
    setShowEv(false);
  }
  function delEv(id){ setEvents(es=>es.filter(e=>e.id!==id)); setShowEv(false); }

  /* copy */
  function openCopy(ev,e){
    e.stopPropagation(); setCopyEv(ev); setCopyDest(todayStr);
    setShowCopy(true); setShowEv(false);
  }
  function doCopy(){
    if(!copyEv||!copyDest) return;
    setEvents(es=>[...es,{...copyEv,id:Date.now(),date:copyDest}]);
    setShowCopy(false);
  }

  /* category CRUD */
  function openNewCat(){ setEditingCat(null); setCatForm({name:"",color:PRESET_COLORS[0]}); setShowCat(true); }
  function openEditCat(c){ setEditingCat(c); setCatForm({name:c.name,color:c.color}); setShowCat(true); }
  function saveCat(){
    if(!catForm.name.trim()) return;
    if(editingCat) setCategories(cs=>cs.map(c=>c.id===editingCat.id?{...c,...catForm}:c));
    else           setCategories(cs=>[...cs,{id:Date.now(),...catForm}]);
    setShowCat(false);
  }
  function delCat(id){
    setCategories(cs=>cs.filter(c=>c.id!==id));
    setEvents(es=>es.filter(e=>e.categoryId!==id));
    if(filterCat===id) setFilterCat(0);
    setShowCat(false);
  }

  /* calendar grid */
  const total = daysInMonth(yr,mo);
  const start = firstDay(yr,mo);
  const cells = [...Array(start).fill(null), ...Array.from({length:total},(_,i)=>i+1)];

  /* sorted events for list */
  const listEvents = [...events]
    .filter(e=>filterCat===0||e.categoryId===filterCat)
    .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));

  /* ── RENDER ── */
  return (
    <div style={{ minHeight:"100dvh", background:"linear-gradient(160deg,#0f0c29,#302b63 55%,#1a1a3e)", color:"#fff", fontFamily:"'Noto Sans JP','Hiragino Sans',sans-serif", fontSize:15, overflowX:"hidden" }}>

      {/* ── TOP BAR ── */}
      <div style={{ background:"rgba(15,12,41,0.85)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", padding:"14px 16px 10px", position:"sticky", top:0, zIndex:50, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#667eea,#764ba2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>📅</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:700 }}>スケジューラー</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)" }}>今日 {today.getFullYear()}/{today.getMonth()+1}/{today.getDate()}</div>
          </div>
        </div>
        {/* Tab bar */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
          {[["cal","📆","カレンダー"],["list","📋","リスト"],["cat","🏷️","カテゴリ"]].map(([v,ic,lb])=>(
            <button key={v} onClick={()=>setView(v)} style={{
              padding:"8px 0", borderRadius:10, border:"none",
              background:view===v?"rgba(102,126,234,0.85)":"rgba(255,255,255,0.08)",
              color:"#fff", cursor:"pointer", fontSize:12, fontWeight:view===v?700:400,
              WebkitTapHighlightColor:"transparent",
            }}>{ic} {lb}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:"14px 12px 100px" }}>

        {/* ══ CALENDAR ══ */}
        {view==="cal" && (
          <>
            {/* Month nav */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <button onClick={prevMo} style={{ width:42, height:42, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:20, cursor:"pointer", WebkitTapHighlightColor:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
              <div style={{ fontSize:20, fontWeight:800 }}>{yr}年 {mo+1}月</div>
              <button onClick={nextMo} style={{ width:42, height:42, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:20, cursor:"pointer", WebkitTapHighlightColor:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
            </div>

            {/* Legend */}
            <div style={{ display:"flex", gap:10, marginBottom:10, flexWrap:"wrap" }}>
              {DAY_TYPES.map(dt=>(
                <span key={dt.key} style={{ fontSize:11, color:"rgba(255,255,255,0.45)", display:"flex", alignItems:"center", gap:3 }}>
                  <span>{dt.emoji}</span>{dt.label}
                </span>
              ))}
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.28)" }}>← 丸をタップで切替</span>
            </div>

            {/* Weekday header */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
              {DAYS_JP.map((d,i)=>(
                <div key={d} style={{ textAlign:"center", fontSize:12, fontWeight:700, padding:"4px 0",
                  color:i===0?"#ff6b6b":i===6?"#6bb3ff":"rgba(255,255,255,0.55)" }}>{d}</div>
              ))}
            </div>

            {/* Grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,minmax(0,1fr))", gap:3 }}>
              {cells.map((day,idx)=>{
                if(!day) return <div key={`_${idx}`}/>;
                const ds  = toDateStr(yr,mo,day);
                const evs = events.filter(e=>e.date===ds);
                const isT = ds===todayStr;
                const isSun=(idx%7)===0, isSat=(idx%7)===6;
                const dtK = dayTypes[ds];
                const dt  = DAY_TYPES.find(d=>d.key===dtK);
                return (
                  <div key={ds} onClick={()=>openNew(ds)} style={{
                    minHeight:68, borderRadius:10,
                    background:dt?dt.bg:isT?"rgba(102,126,234,0.22)":"rgba(255,255,255,0.04)",
                    border:isT?"1.5px solid rgba(102,126,234,0.7)":dt?`1px solid ${dt.color}44`:"1px solid rgba(255,255,255,0.06)",
                    padding:"5px 4px 4px", cursor:"pointer",
                    WebkitTapHighlightColor:"rgba(255,255,255,0.08)",
                    overflow:"hidden", minWidth:0, boxSizing:"border-box",
                  }}>
                    {/* date row */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3, gap:1 }}>
                      <span style={{ fontSize:11, fontWeight:isT?800:500, lineHeight:1,
                        color:isT?"#a78bfa":isSun?"#ff8080":isSat?"#6bb3ff":"rgba(255,255,255,0.85)", flexShrink:0 }}>{day}</span>
                      {/* day-type dot */}
                      <span onClick={e=>cycleDT(ds,e)} style={{
                        width:16, height:16, borderRadius:"50%", fontSize:9,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        background:dt?dt.color+"2a":"rgba(255,255,255,0.08)",
                        border:dt?`1px solid ${dt.color}66`:"1px solid rgba(255,255,255,0.12)",
                        cursor:"pointer", flexShrink:0,
                        WebkitTapHighlightColor:"transparent",
                      }}>
                        {dt?dt.emoji:<span style={{fontSize:7,color:"rgba(255,255,255,0.25)"}}>＋</span>}
                      </span>
                    </div>
                    {/* event chips */}
                    {evs.slice(0,2).map(ev=>{
                      const cat=getCat(ev.categoryId);
                      return (
                        <div key={ev.id} onClick={e=>openEdit(ev,e)} style={{
                          fontSize:8, background:cat.color+"2e",
                          borderLeft:`2px solid ${cat.color}`,
                          borderRadius:3, padding:"1px 3px", color:cat.color,
                          fontWeight:600, whiteSpace:"nowrap", overflow:"hidden",
                          textOverflow:"ellipsis", marginBottom:2, display:"block", maxWidth:"100%",
                        }}>{ev.time} {ev.title}</div>
                      );
                    })}
                    {evs.length>2&&<div style={{fontSize:8,color:"rgba(255,255,255,0.35)",paddingLeft:2}}>+{evs.length-2}</div>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══ LIST ══ */}
        {view==="list" && (
          <>
            {/* filter chips */}
            <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:14, WebkitOverflowScrolling:"touch" }}>
              <button onClick={()=>setFilterCat(0)} style={{ ...S.pill(filterCat===0), flexShrink:0 }}>すべて</button>
              {categories.map(c=>(
                <button key={c.id} onClick={()=>setFilterCat(c.id)} style={{ ...S.pill(filterCat===c.id, c.color+"cc"), flexShrink:0 }}>{c.name}</button>
              ))}
            </div>

            {listEvents.length===0
              ? <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.3)", fontSize:15 }}>予定がありません</div>
              : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {listEvents.map(ev=>{
                    const cat=getCat(ev.categoryId);
                    const dtK=dayTypes[ev.date];
                    const dt=DAY_TYPES.find(d=>d.key===dtK);
                    return (
                      <div key={ev.id} onClick={e=>openEdit(ev,e)} style={{
                        background:"rgba(255,255,255,0.06)", borderRadius:14,
                        border:"1px solid rgba(255,255,255,0.09)",
                        padding:"14px 14px 14px 0",
                        display:"flex", alignItems:"stretch", gap:12,
                        WebkitTapHighlightColor:"rgba(255,255,255,0.06)",
                        cursor:"pointer",
                      }}>
                        <div style={{ width:4, borderRadius:"0 3px 3px 0", background:cat.color, flexShrink:0 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{ev.title}</div>
                          <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                            <span>📅 {ev.date}</span>
                            <span>🕐 {ev.time}</span>
                            <span style={{ color:cat.color }}>● {cat.name}</span>
                            {dt&&<span style={{ color:dt.color, background:dt.bg, padding:"1px 7px", borderRadius:8, fontSize:11 }}>{dt.emoji} {dt.label}</span>}
                          </div>
                          {ev.note&&<div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>📝 {ev.note}</div>}
                        </div>
                        <button onClick={e=>openCopy(ev,e)} style={{ padding:"0 12px", border:"none", background:"transparent", color:"rgba(255,255,255,0.4)", fontSize:18, cursor:"pointer", WebkitTapHighlightColor:"transparent", flexShrink:0, display:"flex", alignItems:"center" }}>📋</button>
                      </div>
                    );
                  })}
                </div>
            }
          </>
        )}

        {/* ══ CATEGORIES ══ */}
        {view==="cat" && (
          <>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:16 }}>🏷️ カテゴリ管理</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
              {categories.map(cat=>(
                <div key={cat.id} style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, border:"1px solid rgba(255,255,255,0.09)", padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:14, height:14, borderRadius:"50%", background:cat.color, flexShrink:0 }}/>
                  <div style={{ flex:1, fontWeight:600, fontSize:15 }}>{cat.name}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginRight:4 }}>{events.filter(e=>e.categoryId===cat.id).length}件</div>
                  <button onClick={()=>openEditCat(cat)} style={{ padding:"7px 16px", borderRadius:10, border:"1px solid rgba(255,255,255,0.18)", background:"rgba(255,255,255,0.07)", color:"#fff", cursor:"pointer", fontSize:13, WebkitTapHighlightColor:"transparent" }}>✏️</button>
                </div>
              ))}
            </div>
            <button onClick={openNewCat} style={{ width:"100%", padding:"15px", borderRadius:14, border:"1.5px dashed rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:15, fontWeight:600, WebkitTapHighlightColor:"transparent" }}>
              ＋ カテゴリを追加
            </button>
          </>
        )}
      </div>

      {/* ── FAB ── */}
      {(view==="cal"||view==="list") && (
        <button onClick={()=>{setSelDate(todayStr);setEditingEv(null);setEvForm({title:"",time:"09:00",categoryId:categories[0]?.id||1,note:""});setShowEv(true);}}
          style={{ position:"fixed", bottom:28, right:20, width:58, height:58, borderRadius:"50%", background:"linear-gradient(135deg,#667eea,#764ba2)", border:"none", color:"#fff", fontSize:28, cursor:"pointer", boxShadow:"0 6px 20px rgba(102,126,234,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:40, WebkitTapHighlightColor:"transparent" }}>
          ＋
        </button>
      )}

      {/* ── EVENT MODAL ── */}
      {showEv && (
        <Modal onClose={()=>setShowEv(false)}>
          <div style={{ fontSize:17, fontWeight:800, marginBottom:18 }}>{editingEv?"✏️ 予定を編集":"➕ 予定を追加"}</div>

          <label style={S.label}>日付</label>
          <input type="date" value={selDate||""} onChange={e=>setSelDate(e.target.value)} style={S.input}/>

          <label style={S.label}>タイトル</label>
          <input placeholder="例: チームミーティング" value={evForm.title} onChange={e=>setEvForm(f=>({...f,title:e.target.value}))} style={S.input}/>

          <label style={S.label}>時刻</label>
          <input type="time" value={evForm.time} onChange={e=>setEvForm(f=>({...f,time:e.target.value}))} style={S.input}/>

          <label style={S.label}>カテゴリ</label>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
            {categories.map(c=>(
              <button key={c.id} onClick={()=>setEvForm(f=>({...f,categoryId:c.id}))} style={{ ...S.pill(evForm.categoryId===c.id, c.color+"cc"), display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:c.color, display:"inline-block" }}/>{c.name}
              </button>
            ))}
          </div>

          <label style={S.label}>メモ（任意）</label>
          <textarea placeholder="備考やメモ..." value={evForm.note} onChange={e=>setEvForm(f=>({...f,note:e.target.value}))}
            style={{ ...S.input, height:80, resize:"none" }}/>

          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            {editingEv&&<>
              <button onClick={e=>openCopy(editingEv,{stopPropagation:()=>{}})} style={{ ...S.btn(false), flex:"none", padding:"15px 16px", fontSize:18 }}>📋</button>
              <button onClick={()=>delEv(editingEv.id)} style={{ ...S.btn(false), color:"#ff7070" }}>削除</button>
            </>}
            <button onClick={()=>setShowEv(false)} style={S.btn(false)}>キャンセル</button>
            <button onClick={saveEv} disabled={!evForm.title.trim()} style={{ ...S.btn(true), opacity:evForm.title.trim()?1:0.4 }}>
              {editingEv?"保存":"追加"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── COPY MODAL ── */}
      {showCopy&&copyEv&&(
        <Modal onClose={()=>setShowCopy(false)}>
          <div style={{ fontSize:17, fontWeight:800, marginBottom:6 }}>📋 予定をコピー</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginBottom:16 }}>別の日にそのままコピーします</div>

          <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:12, padding:"12px 14px", marginBottom:18 }}>
            <div style={{ fontWeight:700, marginBottom:4 }}>{copyEv.title}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", display:"flex", gap:10, flexWrap:"wrap" }}>
              <span>📅 {copyEv.date}</span>
              <span>🕐 {copyEv.time}</span>
              <span style={{ color:getCat(copyEv.categoryId).color }}>● {getCat(copyEv.categoryId).name}</span>
            </div>
            {copyEv.note&&<div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:4 }}>📝 {copyEv.note}</div>}
          </div>

          <label style={S.label}>コピー先の日付</label>
          <input type="date" value={copyDest} onChange={e=>setCopyDest(e.target.value)} style={S.input}/>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setShowCopy(false)} style={S.btn(false)}>キャンセル</button>
            <button onClick={doCopy} style={{ ...S.btn(true), opacity:copyDest?1:0.4 }}>この日にコピー</button>
          </div>
        </Modal>
      )}

      {/* ── CATEGORY MODAL ── */}
      {showCat&&(
        <Modal onClose={()=>setShowCat(false)}>
          <div style={{ fontSize:17, fontWeight:800, marginBottom:18 }}>{editingCat?"✏️ カテゴリを編集":"＋ カテゴリを追加"}</div>

          <label style={S.label}>名前</label>
          <input placeholder="カテゴリ名" value={catForm.name} onChange={e=>setCatForm(f=>({...f,name:e.target.value}))} style={S.input}/>

          <label style={S.label}>色</label>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18 }}>
            {PRESET_COLORS.map(c=>(
              <div key={c} onClick={()=>setCatForm(f=>({...f,color:c}))} style={{
                width:32, height:32, borderRadius:"50%", background:c, cursor:"pointer",
                border:catForm.color===c?"3px solid #fff":"3px solid transparent",
                transform:catForm.color===c?"scale(1.15)":"scale(1)",
                transition:"transform 0.1s", boxSizing:"border-box",
                WebkitTapHighlightColor:"transparent",
              }}/>
            ))}
          </div>

          {/* preview */}
          <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:12, padding:"10px 14px", marginBottom:18, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:12, height:12, borderRadius:"50%", background:catForm.color }}/>
            <span style={{ fontWeight:600 }}>{catForm.name||"プレビュー"}</span>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            {editingCat&&<button onClick={()=>delCat(editingCat.id)} style={{ ...S.btn(false), color:"#ff7070" }}>削除</button>}
            <button onClick={()=>setShowCat(false)} style={S.btn(false)}>キャンセル</button>
            <button onClick={saveCat} disabled={!catForm.name.trim()} style={{ ...S.btn(true), opacity:catForm.name.trim()?1:0.4 }}>保存</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Modal wrapper ─── */
function Modal({ children, onClose }) {
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0,
      background:"rgba(0,0,0,0.65)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      zIndex:200, padding:"0",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"linear-gradient(170deg,#1e1b4b,#2d2a5e)",
        border:"1px solid rgba(255,255,255,0.12)",
        borderRadius:"24px 24px 0 0",
        padding:"20px 20px calc(20px + env(safe-area-inset-bottom))",
        width:"100%", maxWidth:520,
        maxHeight:"90dvh", overflowY:"auto",
        WebkitOverflowScrolling:"touch",
      }}>
        {/* drag handle */}
        <div style={{ width:40, height:4, borderRadius:2, background:"rgba(255,255,255,0.2)", margin:"0 auto 18px" }}/>
        {children}
      </div>
    </div>
  );
}
