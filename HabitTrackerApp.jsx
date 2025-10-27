import React, { useEffect, useState, useRef } from 'react'
export default function HabitTrackerApp() {
  const [habits, setHabits] = useState(() => {
    try { return JSON.parse(localStorage.getItem('habits')||'[]') } catch { return [] }
  })
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0,10))
  const [editing, setEditing] = useState(null)
  const [showStats, setShowStats] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme')||'light')
  const reminderTimers = useRef({})
  useEffect(()=>{ localStorage.setItem('habits', JSON.stringify(habits)) },[habits])
  useEffect(()=>{ document.documentElement.dataset.theme=theme; localStorage.setItem('theme',theme) },[theme])
  useEffect(()=>{ scheduleAllReminders() },[habits])
  function addHabit(payload){
    const id = Date.now().toString()
    setHabits(h=>[...h,{id,created:new Date().toISOString(),name:payload.name,category:payload.category||'General',goal:payload.goal||1,unit:payload.unit||'times',notes:payload.notes||'',reminder:payload.reminder||null,history:{}}])
  }
  function updateHabit(id,patch){ setHabits(h=>h.map(x=>x.id===id?{...x,...patch}:x)) }
  function deleteHabit(id){ setHabits(h=>h.filter(x=>x.id!==id)) }
  function toggleCompletion(habitId,date){
    setHabits(h=>h.map(hb=>{
      if(hb.id!==habitId) return hb
      const history = {...hb.history}
      history[date] = history[date]?0:hb.goal || 1
      return {...hb,history}
    }))
  }
  function setProgress(habitId,date,value){
    setHabits(h=>h.map(hb=>hb.id===habitId?{...hb,history:{...hb.history,[date]:value}}:hb))
  }
  function scheduleAllReminders(){
    Object.values(reminderTimers.current).forEach(t=>clearTimeout(t))
    reminderTimers.current = {}
    habits.forEach(h=>{
      if(!h.reminder) return
      try{ new Notification('Reminder enabled') }catch(e){}
      const [hour,min] = h.reminder.split(':').map(Number)
      const now = new Date()
      const next = new Date(now.getFullYear(),now.getMonth(),now.getDate(),hour,min,0)
      if(next<=now) next.setDate(next.getDate()+1)
      const ms = next - now
      reminderTimers.current[h.id] = setTimeout(()=>{ try{ new Notification(h.name+' — time for your habit') }catch(e){}; scheduleAllReminders() }, ms)
    })
  }
  function importData(json){ try{ const data = JSON.parse(json); setHabits(data); return true }catch{return false} }
  function exportData(){ return JSON.stringify(habits,null,2) }
  const today = selectedDate
  function dailyProgress(date){
    if(!habits.length) return 0
    const total = habits.reduce((s,h)=>s+(h.goal||1),0)
    const done = habits.reduce((s,h)=>s+(h.history && h.history[date]?Math.min(h.history[date],h.goal||1):0),0)
    return Math.round(done/total*100)
  }
  function weeklyStats(){
    const days = 14
    const arr = []
    for(let i=days-1;i>=0;i--){
      const d = new Date()
      d.setDate(d.getDate()-i)
      const key = d.toISOString().slice(0,10)
      const pct = dailyProgress(key)
      arr.push({date:key,percent:pct})
    }
    return arr
  }
  function calendarMatrix(monthDate){
    const d = new Date(monthDate)
    const year = d.getFullYear(), month = d.getMonth()
    const first = new Date(year,month,1)
    const startDay = first.getDay()
    const days = new Date(year,month+1,0).getDate()
    const weeks = []
    let week=[]
    for(let i=0;i<startDay;i++) week.push(null)
    for(let day=1;day<=days;day++){
      week.push(new Date(year,month,day).toISOString().slice(0,10))
      if(week.length===7){ weeks.push(week); week=[] }
    }
    if(week.length) while(week.length<7) week.push(null); weeks.push(week)
    return weeks
  }
  return (
    <div className="min-h-screen p-6 bg-gray-50" style={{fontFamily:'Inter, system-ui'}}>
      <header className="max-w-5xl mx-auto flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Today</h1>
        <div className="flex gap-3 items-center">
          <button onClick={()=>setShowStats(s=>!s)} className="px-3 py-1 rounded border">Stats</button>
          <button onClick={()=>setTheme(t=>t==='light'?'dark':'light')} className="px-3 py-1 rounded border">Theme</button>
          <button onClick={()=>{ setEditing({}); }} className="px-3 py-1 rounded bg-green-100">+ Habit</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto grid gap-6">
        <section className="bg-white p-4 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Daily progress</div>
              <div className="text-lg font-semibold">{dailyProgress(today)}%</div>
            </div>
            <div className="w-2/3">
              <div className="h-4 bg-gray-100 rounded overflow-hidden">
                <div style={{width:`${dailyProgress(today)}%`}} className="h-full bg-green-300" />
              </div>
            </div>
          </div>
        </section>
        <section className="bg-white p-4 rounded shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="p-2 border rounded" />
            <button onClick={()=>{ setSelectedDate(new Date().toISOString().slice(0,10)) }} className="px-2 py-1 border rounded">Today</button>
            <button onClick={()=>{ navigator.clipboard.writeText(exportData()) }} className="px-2 py-1 border rounded">Export</button>
            <label className="px-2 py-1 border rounded cursor-pointer">Import<input type="file" accept="application/json" onChange={e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>importData(ev.target.result); r.readAsText(f) }} style={{display:'none'}}/></label>
          </div>
          <div className="space-y-3">
            {habits.map(h=>{
              const completed = h.history && h.history[selectedDate]
              return (
                <div key={h.id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{h.name} <span className="text-xs text-gray-500">{h.category}</span></div>
                    <div className="text-sm text-gray-500">{(completed||0)}/{h.goal} {h.unit}</div>
                    <div className="text-sm text-gray-400">{h.notes}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} value={(h.history&&h.history[selectedDate])||0} onChange={e=>setProgress(h.id,selectedDate,Number(e.target.value))} className="w-20 p-1 border rounded" />
                    <button onClick={()=>toggleCompletion(h.id,selectedDate)} className="px-2 py-1 border rounded">Toggle</button>
                    <button onClick={()=>setEditing(h)} className="px-2 py-1 border rounded">Edit</button>
                    <button onClick={()=>deleteHabit(h.id)} className="px-2 py-1 border rounded text-red-600">Delete</button>
                  </div>
                </div>
              )
            })}
            {!habits.length && <div className="text-gray-500">No habits yet. Add one!</div>}
          </div>
        </section>
        {showStats && (
          <section className="bg-white p-4 rounded shadow-sm">
            <h2 className="font-semibold mb-3">Weekly/2-week Stats</h2>
            <div className="grid grid-cols-7 gap-2 text-xs text-center">
              {weeklyStats().map(s=> <div key={s.date} className="p-2 border rounded"><div className="font-medium">{s.date.slice(5)}</div><div className="text-sm">{s.percent}%</div></div>)}
            </div>
            <div className="mt-4">Current Streak: {(() => {
              let streak=0; let d=new Date(); for(;;){ const k=d.toISOString().slice(0,10); const allDone = habits.length && habits.every(h=>h.history && h.history[k] && h.history[k]>= (h.goal||1)); if(allDone) { streak++; d.setDate(d.getDate()-1) } else break } return streak })()}</div>
          </section>
        )}
        <section className="bg-white p-4 rounded shadow-sm">
          <h2 className="font-semibold mb-3">Calendar</h2>
          <CalendarView habits={habits} onDateClick={setSelectedDate} selectedDate={selectedDate} calendarMatrix={calendarMatrix} />
        </section>
      </main>
      {editing!==null && <HabitEditor initial={editing} onClose={()=>setEditing(null)} onSave={(payload)=>{ if(editing && editing.id) updateHabit(editing.id,payload); else addHabit(payload); setEditing(null) }} />}
    </div>
  )
}
function CalendarView({habits,onDateClick,selectedDate,calendarMatrix}){
  const m = new Date()
  const weeks = calendarMatrix(m)
  function dayScore(date){ if(!date) return 0; const total = habits.reduce((s,h)=>s+(h.goal||1),0); const done = habits.reduce((s,h)=>s+(h.history && h.history[date]?Math.min(h.history[date],h.goal||1):0),0); return total?Math.round(done/total*100):0 }
  return (
    <div>
      <div className="grid grid-cols-7 gap-2 text-sm">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=> <div key={d} className="text-center font-medium">{d}</div>)}
      </div>
      <div className="mt-2 space-y-2">
        {weeks.map((week,i)=> (
          <div key={i} className="grid grid-cols-7 gap-2">
            {week.map((day,j)=>{
              const score = day?dayScore(day):0
              const isSelected = day===selectedDate
              return (
                <button key={j} onClick={()=>day && onDateClick(day)} className={`p-2 h-20 border rounded flex flex-col items-center justify-between ${isSelected?'ring-2 ring-green-300':''}`}>
                  <div className="text-xs text-gray-500">{day?Number(day.slice(-2)):''}</div>
                  <div className="text-xs">{score}%</div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
function HabitEditor({initial,onClose,onSave}){
  const [form, setForm] = useState(()=> initial && initial.id ? {...initial} : {name:'',category:'General',goal:1,unit:'times',notes:'',reminder:''})
  useEffect(()=> setForm(initial && initial.id?{...initial}:form),[initial])
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white p-4 rounded w-full max-w-md">
        <h3 className="font-semibold mb-2">{initial && initial.id ? 'Edit' : 'Add'} Habit</h3>
        <div className="space-y-2">
          <input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2 border rounded" />
          <input placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="w-full p-2 border rounded" />
          <div className="flex gap-2">
            <input type="number" min={1} value={form.goal} onChange={e=>setForm({...form,goal:Number(e.target.value)})} className="w-1/2 p-2 border rounded" />
            <input placeholder="Unit" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} className="w-1/2 p-2 border rounded" />
          </div>
          <input type="time" value={form.reminder||''} onChange={e=>setForm({...form,reminder:e.target.value})} className="w-full p-2 border rounded" />
          <textarea placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full p-2 border rounded" />
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
          <button onClick={()=>{ onSave(form) }} className="px-3 py-1 bg-green-100 rounded">Save</button>
        </div>
      </div>
    </div>
  )
}
