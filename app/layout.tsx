import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Kolab — Lo extraordinario sucede entre nosotros',description:'Cultura organizacional e inteligencia colectiva. Conecta con personas, transforma equipos y descubre lo que solo puede pasar juntos.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="es"><body>{children}</body></html>}
