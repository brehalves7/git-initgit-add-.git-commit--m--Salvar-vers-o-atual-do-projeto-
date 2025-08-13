
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Book, Contact, FileText, GraduationCap, User, WalletCards, ShieldQuestion, UserCheck, ChevronDown, Lock, CreditCard, Landmark, BookOpen, Users, LogOut, MoreVertical, MapPin } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { CitySelector } from '@/components/city-selector';

type UserRole = 'mestre' | 'pessoa' | 'aluno' | 'limitado' | null;


export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);


  useEffect(() => {
    setIsClient(true);
    const authStatus = sessionStorage.getItem('isAuthenticated') === 'true';
    const role = sessionStorage.getItem('userRole') as UserRole;
    const name = sessionStorage.getItem('userName');
    if (!authStatus) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      setUserRole(role);
      setUserName(name);
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }
    }
    
    const handleStorageChange = () => {
        const name = sessionStorage.getItem('userName');
        const savedAvatar = localStorage.getItem('userAvatar');
        setUserName(name);
        if (savedAvatar) {
            setAvatar(savedAvatar);
        }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check when the component mounts or user navigates
    handleStorageChange();

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userName');
    localStorage.removeItem('userAvatar');
    toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
    })
    router.push('/login');
  };

  if (!isClient || !isAuthenticated) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3 cursor-pointer hover:bg-sidebar-accent/90 transition-colors">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={avatar ?? "https://placehold.co/48x48.png"} alt="@brayan" data-ai-hint="man face" />
                    <AvatarFallback>{userName?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1">
                    <span className="text-base font-semibold text-sidebar-foreground">Olá, {userName}</span>
                    <span className="text-sm text-sidebar-foreground/80">Seja bem-vindo</span>
                  </div>
                   <MoreVertical className="h-5 w-5 text-sidebar-foreground/80" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                 <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarHeader>
        <SidebarContent>
            
                <SidebarGroup>
                    <SidebarGroupLabel>Minha Conta</SidebarGroupLabel>
                    <SidebarMenu>
                        
                          <SidebarMenuItem>
                            <Link href="/meus-cursos">
                              <SidebarMenuButton variant="outline">
                                  <Book />
                                  Meus Cursos
                              </SidebarMenuButton>
                            </Link>
                          </SidebarMenuItem>
                        
                        
                        <Collapsible asChild>
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton variant="outline" className='justify-between'>
                                  <div className='flex items-center gap-2'>
                                    <User />
                                    Meu Perfil
                                  </div>
                                  <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                <SidebarMenuSubItem>
                                  <Link href="/perfil/dados-gerais">
                                    <SidebarMenuSubButton>
                                      <Contact />
                                      Dados Gerais
                                    </SidebarMenuSubButton>
                                  </Link>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                  <Link href="/perfil/alterar-senha">
                                  <SidebarMenuSubButton>
                                    <Lock />
                                    Alterar Senha
                                  </SidebarMenuSubButton>
                                  </Link>
                                </SidebarMenuSubItem>
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>

                        <SidebarMenuItem>
                          <Link href="/certificados">
                            <SidebarMenuButton variant="outline">
                                <FileText />
                                Meus Certificados
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                        
                        
                          <SidebarMenuItem>
                            <Link href="/material-de-estudo">
                            <SidebarMenuButton variant="outline">
                                <BookOpen />
                                Material de Estudo
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                        

                        <SidebarMenuItem>
                          <Link href="/suporte">
                            <SidebarMenuButton variant="outline">
                                <Contact />
                                Suporte
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            
                <SidebarGroup>
                    <SidebarGroupLabel>Franqueado</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <Link href="/pre-matriculas">
                                <SidebarMenuButton variant="outline">
                                    <GraduationCap />
                                    Pré-matrículas
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <Link href="/matriculas">
                                <SidebarMenuButton variant="outline">
                                    <WalletCards />
                                    Matrículas
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        {userRole === 'mestre' && (
                           <>
                                <SidebarMenuItem>
                                    <Link href="/usuarios">
                                        <SidebarMenuButton variant="outline">
                                            <Users />
                                            Usuários
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <Link href="/cidades">
                                        <SidebarMenuButton variant="outline">
                                            <MapPin />
                                            Cidades
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                           </>
                        )}
                        <SidebarMenuItem>
                          <Link href="/pagamento">
                            <SidebarMenuButton variant="outline">
                                <CreditCard />
                                Pagamento
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <Link href="/resumo-caixa">
                            <SidebarMenuButton variant="outline">
                                <Landmark />
                                Resumo de caixa
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                 <div className="flex items-center gap-3">
                    <Image src="/logo.png" alt="GCS Cursos" width={32} height={32} />
                    <div>
                        <h1 className="text-lg font-bold">GCS Cursos</h1>
                        <p className="text-sm text-muted-foreground">Portal do Aluno</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <CitySelector />
                 <Avatar className="h-9 w-9">
                  <AvatarImage src={avatar ?? "https://placehold.co/36x36.png"} alt="@user" data-ai-hint="man face" />
                  <AvatarFallback>{userName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
            <section className="mb-6">
                 <div className="flex items-center gap-3">
                    <div className="rounded-full bg-accent p-2">
                        <WalletCards className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Resumo</h2>
                        <p className="text-sm text-muted-foreground">Financeiro</p>
                    </div>
                </div>
            </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
