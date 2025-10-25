"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Book,
  Contact,
  FileText,
  GraduationCap,
  User,
  WalletCards,
  ShieldQuestion,
  UserCheck,
  ChevronDown,
  Lock,
  CreditCard,
  Landmark,
  BookOpen,
  Users,
  LogOut,
  MoreVertical,
  MapPin,
  TrendingUp,
  DollarSign,
  Users as UsersIcon,
  School,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Building,
  Calendar,
} from "lucide-react";
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { CitySelector } from "@/components/city-selector";

type UserRole = "mestre" | "pessoa" | "aluno" | "limitado" | null;

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Dados mockados para o dashboard do mestre
  const [dashboardData, setDashboardData] = useState({
    totalAlunos: 1247,
    totalMatriculas: 289,
    preMatriculas: 45,
    receitaMensal: 125430.50,
    receitaAnual: 985210.75,
    cidadesAtivas: 12,
    usuariosAtivos: 28,
    taxaConversao: 68,
    alunosNovosMes: 89,
    matriculasPendentes: 23,
    pagamentosAguardando: 15,
  });

  useEffect(() => {
    setIsClient(true);
    const authStatus = sessionStorage.getItem("isAuthenticated") === "true";
    const role = sessionStorage.getItem("userRole") as UserRole;
    const name = sessionStorage.getItem("userName");
    if (!authStatus) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
      setUserRole(role);
      setUserName(name);
      const savedAvatar = localStorage.getItem("userAvatar");
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }
    }

    const handleStorageChange = () => {
      const name = sessionStorage.getItem("userName");
      const savedAvatar = localStorage.getItem("userAvatar");
      setUserName(name);
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Also check when the component mounts or user navigates
    handleStorageChange();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userName");
    localStorage.removeItem("userAvatar");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    router.push("/login");
  };

  // Função para verificar se o usuário pode ver o grupo Franqueado
  const canSeeFranqueado = () => {
    return userRole !== "aluno";
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
                  <AvatarImage
                    src={avatar ?? "https://placehold.co/48x48.png"}
                    alt="@brayan"
                    data-ai-hint="man face"
                  />
                  <AvatarFallback>
                    {userName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1">
                  <span className="text-base font-semibold text-sidebar-foreground">
                    Olá, {userName}
                  </span>
                  <span className="text-sm text-sidebar-foreground/80">
                    {userRole === "mestre" ? "Administrador Master" : "Seja bem-vindo"}
                  </span>
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
          {/* Grupo Minha Conta - Sempre visível para todos os usuários */}
          <SidebarGroup>
            <SidebarGroupLabel>Minha Conta</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  variant="outline"
                  className="w-full justify-start gap-3 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
                >
                  <Link href="/meus-cursos">
                    <Book className="h-5 w-5" />
                    <span className="font-medium">Meus Cursos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible asChild>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      variant="outline"
                      className="w-full justify-between bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5" />
                        <span className="font-medium">Meu Perfil</span>
                      </div>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className="bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
                        >
                          <Link href="/perfil/dados-gerais">
                            <Contact className="h-4 w-4" />
                            <span className="font-medium">Dados Gerais</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className="bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
                        >
                          <Link href="/perfil/alterar-senha">
                            <Lock className="h-4 w-4" />
                            <span className="font-medium">Alterar Senha</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  variant="outline"
                  className="w-full justify-start gap-3 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
                >
                  <Link href="/material-de-estudo">
                    <BookOpen className="h-5 w-5" />
                    <span className="font-medium">Material de Estudo</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  variant="outline"
                  className="w-full justify-start gap-3 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
                >
                  <Link href="/suporte">
                    <Contact className="h-5 w-5" />
                    <span className="font-medium">Suporte</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* Grupo Franqueado - Visível apenas para usuários que NÃO são alunos */}
          {canSeeFranqueado() && (
            <SidebarGroup>
              <SidebarGroupLabel>Franqueado</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    variant="outline"
                    className="w-full justify-start gap-3 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
                  >
                    <Link href="/pre-matriculas">
                      <GraduationCap className="h-5 w-5" />
                      <span className="font-medium">Pré-matrículas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    variant="outline"
                    className="w-full justify-start gap-3 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
                  >
                    <Link href="/matriculas">
                      <WalletCards className="h-5 w-5" />
                      <span className="font-medium">Matrículas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {userRole === "mestre" && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        variant="outline"
                        className="w-full justify-start gap-3 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
                      >
                        <Link href="/usuarios">
                          <Users className="h-5 w-5" />
                          <span className="font-medium">Usuários</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        variant="outline"
                        className="w-full justify-start gap-3 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
                      >
                        <Link href="/cidades">
                          <MapPin className="h-5 w-5" />
                          <span className="font-medium">Cidades</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    variant="outline"
                    className="w-full justify-start gap-3 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
                  >
                    <Link href="/pagamento">
                      <CreditCard className="h-5 w-5" />
                      <span className="font-medium">Pagamento</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    variant="outline"
                    className="w-full justify-start gap-3 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
                  >
                    <Link href="/resumo-caixa">
                      <Landmark className="h-5 w-5" />
                      <span className="font-medium">Resumo de caixa</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}
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
                <p className="text-sm text-muted-foreground">
                  {userRole === "aluno"
                    ? "Portal do Aluno"
                    : userRole === "mestre"
                    ? "Painel Master"
                    : "Portal Administrativo"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* CitySelector visível apenas para usuários que não são alunos */}
            {userRole !== "aluno" && <CitySelector />}
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={avatar ?? "https://placehold.co/36x36.png"}
                alt="@user"
                data-ai-hint="man face"
              />
              <AvatarFallback>
                {userName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <section className="mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-accent p-2">
                <BarChart3 className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {userRole === "aluno" 
                    ? "Meu Dashboard" 
                    : userRole === "mestre"
                    ? "Painel de Controle Master"
                    : "Resumo"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {userRole === "aluno"
                    ? "Bem-vindo ao seu portal"
                    : userRole === "mestre"
                    ? "Visão geral completa do sistema"
                    : "Financeiro"}
                </p>
              </div>
            </div>
          </section>

          {/* Dashboard para Aluno */}
          {userRole === "aluno" && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Meus Cursos Ativos
                  </CardTitle>
                  <Book className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">
                    Cursos em andamento
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Certificados
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">
                    Certificados disponíveis
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Progresso
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">75%</div>
                  <p className="text-xs text-muted-foreground">
                    Média de conclusão
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dashboard para Mestre */}
          {userRole === "mestre" && (
            <div className="space-y-6">
              {/* Métricas Principais */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Alunos
                    </CardTitle>
                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.totalAlunos.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      +{dashboardData.alunosNovosMes} este mês
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Receita Mensal
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R$ {dashboardData.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +12% em relação ao mês anterior
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Matrículas Ativas
                    </CardTitle>
                    <School className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.totalMatriculas}</div>
                    <p className="text-xs text-muted-foreground">
                      +{dashboardData.preMatriculas} pré-matrículas
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Taxa de Conversão
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.taxaConversao}%</div>
                    <p className="text-xs text-muted-foreground">
                      Pré-matrículas para matrículas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Segunda Linha de Métricas */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Cidades Ativas
                    </CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.cidadesAtivas}</div>
                    <p className="text-xs text-muted-foreground">
                      Franquias operando
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Usuários Ativos
                    </CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.usuariosAtivos}</div>
                    <p className="text-xs text-muted-foreground">
                      Colaboradores no sistema
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Receita Anual
                    </CardTitle>
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R$ {dashboardData.receitaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Acumulado do ano
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pendências
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.pagamentosAguardando}</div>
                    <p className="text-xs text-muted-foreground">
                      Pagamentos em atraso
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Ações Rápidas e Status */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                    <CardDescription>
                      Gerencie rapidamente o sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button asChild variant="outline" className="h-16 flex-col">
                        <Link href="/pre-matriculas">
                          <GraduationCap className="h-5 w-5 mb-1" />
                          <span>Pré-matrículas</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-16 flex-col">
                        <Link href="/matriculas">
                          <School className="h-5 w-5 mb-1" />
                          <span>Matrículas</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-16 flex-col">
                        <Link href="/usuarios">
                          <Users className="h-5 w-5 mb-1" />
                          <span>Usuários</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-16 flex-col">
                        <Link href="/cidades">
                          <Building className="h-5 w-5 mb-1" />
                          <span>Cidades</span>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status do Sistema</CardTitle>
                    <CardDescription>
                      Situação atual
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Sistema Online</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Ativo
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Matrículas Pendentes</span>
                      </div>
                      <Badge variant="outline">{dashboardData.matriculasPendentes}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Pagamentos Atraso</span>
                      </div>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        {dashboardData.pagamentosAguardando}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Última Atualização</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Hoje</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Componentes Card adicionais
const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3
    className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
  >
    {children}
  </h3>
);

const CardDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
);

const CardContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

const Badge = ({ 
  children, 
  variant = "default", 
  className 
}: { 
  children: React.ReactNode; 
  variant?: "default" | "secondary" | "outline" | "destructive";
  className?: string;
}) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 
    ${variant === "default" ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/80" : ""}
    ${variant === "secondary" ? "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80" : ""}
    ${variant === "outline" ? "text-foreground" : ""}
    ${variant === "destructive" ? "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80" : ""}
    ${className}`}
  >
    {children}
  </span>
);