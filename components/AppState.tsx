import React, { createContext, useContext, useMemo, useState } from 'react';
export type TrackerItem = { id: number; title: string; done: boolean };
type AppState = { dark:boolean; setDark:(v:boolean)=>void; items:TrackerItem[]; addItem:()=>void; toggleItem:(id:number)=>void; clearItems:()=>void };
const initialItems:TrackerItem[]=[{id:1,title:'Разминка',done:true},{id:2,title:'Приседания · 3 подхода',done:false},{id:3,title:'Отжимания · 3 подхода',done:false}];
const Context=createContext<AppState|null>(null);
export function AppStateProvider({children}:{children:React.ReactNode}) {
 const [dark,setDark]=useState(true); const [items,setItems]=useState(initialItems);
 const value=useMemo(()=>({dark,setDark,items,addItem:()=>setItems((a)=>[...a,{id:Date.now(),title:'Подход '+(a.length+1),done:false}]),toggleItem:(id:number)=>setItems((a)=>a.map(x=>x.id===id?{...x,done:!x.done}:x)),clearItems:()=>setItems([])}),[dark,items]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAppState(){const s=useContext(Context);if(!s)throw new Error('AppStateProvider не подключён');return s;}
