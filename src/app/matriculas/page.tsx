
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, UserPlus, ArrowUpDown, Phone, MessageCircle, Pencil, Filter, Plus, Search, FileDown, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getPreMatriculas, updatePreMatriculaStatus, addMatriculaData, PreMatriculaData, MatriculaData } from '@/app/pre-matriculas/data';
import { CitySelector } from '@/components/city-selector';

type SortKey = keyof MatriculaData;

const validateCpf = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  let remainder;
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  return true;
};

const maskCpf = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .substring(0, 14);
};

const maskWhatsapp = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

let lastId = 0;
const generateId = () => {
    lastId++;
    return String(lastId);
}

const StatusBadge = ({ status }: { status: MatriculaData['status'] }) => {
    const statusConfig = {
      ativo: { text: 'Ativo', className: 'bg-green-100 text-green-800' },
      inativo: { text: 'Inativo', className: 'bg-red-100 text-red-800' },
      trancado: { text: 'Trancado', className: 'bg-gray-100 text-gray-800' },
      aguardando_pagamento: { text: 'Aguardando Pagamento', className: 'bg-yellow-100 text-yellow-800 border-yellow-500' },
    };
  
    const config = statusConfig[status] || { text: 'Desconhecido', className: '' };
  
    return (
      <Badge variant={status === 'aguardando_pagamento' ? 'outline' : 'default'} className={config.className}>
        {config.text}
      </Badge>
    );
  };
  

  const cursos: { [key: string]: string } = {
    trator_agricola: "TRATOR AGRÍCOLA",
    retroescavadeira: "RETROESCAVADEIRA",
    pa_carregadeira: "PÁ CARREGADEIRA",
    pacote_completo: "PACOTE COMPLETO",
  };

  const allCursos = [
    "TRATOR AGRÍCOLA",
    "RETROESCAVADEIRA",
    "PÁ CARREGADEIRA",
    "PACOTE COMPLETO",
  ];

  const allStatus: MatriculaData['status'][] = [
      'ativo', 'aguardando_pagamento', 'inativo', 'trancado'
  ];

export default function MatriculasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matriculas, setMatriculas] = useState<(MatriculaData | undefined)[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [franqueadoCity, setFranqueadoCity] = useState<string | null>(null);

  const [editingMatricula, setEditingMatricula] = useState<MatriculaData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newMatriculaUser, setNewMatriculaUser] = useState('');
  const [newMatriculaCurso, setNewMatriculaCurso] = useState('');
  const [newMatriculaHorario, setNewMatriculaHorario] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [machineFilter, setMachineFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: 'ascending' | 'descending' }>({ key: 'criado', direction: 'descending' });

  const refreshMatriculas = () => {
    const preMatriculasData = getPreMatriculas();
    const matriculados = preMatriculasData
      .filter(p => p.matricula)
      .map(p => p.matricula);
    setMatriculas(matriculados);
  };
  
  useEffect(() => {
    setIsClient(true);
    const authStatus = sessionStorage.getItem('isAuthenticated') === 'true';
    const roleFromSession = sessionStorage.getItem('userRole');
    setUserRole(roleFromSession);
    if (!authStatus) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      refreshMatriculas();
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }
      // Se for franqueado, pega a cidade do cadastro dele
      if (roleFromSession === 'pessoa') {
        const userName = sessionStorage.getItem('userName');
        let allUsers = [];
        const keys = Object.keys(localStorage).filter(k => k.startsWith('usersData_'));
        for (const key of keys) {
          try {
            const users = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(users)) allUsers = allUsers.concat(users);
          } catch {}
        }
        const user = allUsers.find(u => u.name === userName && u.role === 'pessoa');
        if (user && user.city) {
          setFranqueadoCity(user.city);
        }
      }
      const preMatriculasData = getPreMatriculas();
      const allIds = preMatriculasData
        .filter(p => p.matricula)
        .map(item => parseInt(item.matricula!.id, 10));
      if (allIds.length > 0) {
        lastId = Math.max(...allIds);
      }
    }
  }, [router]);

  useEffect(() => {
    if (isClient) {
        const handleMatriculaEvent = () => {
            refreshMatriculas();
        };
        window.addEventListener('matriculaCriada', handleMatriculaEvent);
        window.addEventListener('matriculaAtualizada', handleMatriculaEvent);
        window.addEventListener('preMatriculaDataChanged', handleMatriculaEvent);

        return () => {
            window.removeEventListener('matriculaCriada', handleMatriculaEvent);
            window.removeEventListener('matriculaAtualizada', handleMatriculaEvent);
            window.removeEventListener('preMatriculaDataChanged', handleMatriculaEvent);
        };
    }
  }, [isClient]);

  const filteredMatriculas = useMemo(() => {
    return matriculas
        .filter(Boolean)
        .filter(m => {
            const searchLower = searchTerm.toLowerCase();
            return m!.nome.toLowerCase().includes(searchLower) || m!.cpf.includes(searchTerm);
        })
        .filter(m => {
            return machineFilter ? m!.maquinas.includes(machineFilter) : true;
        })
        .filter(m => {
            return statusFilter ? m!.status === statusFilter : true;
        }) as MatriculaData[];
  }, [matriculas, searchTerm, machineFilter, statusFilter]);

  const sortedMatriculas = useMemo(() => {
    let sortableItems = [...filteredMatriculas];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        let comparison = 0;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue, 'pt-BR', { sensitivity: 'base' });
        } else if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [filteredMatriculas, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setMachineFilter('');
    setStatusFilter('');
  }
  
  const handleUpdateMatricula = () => {
    if (!editingMatricula) return;
  
    if (!validateCpf(editingMatricula.cpf)) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um CPF válido para atualizar.',
        variant: 'destructive',
      });
      return;
    }
  
    if (matriculas.some(m => m && m.id !== editingMatricula.id && m.cpf.replace(/[^\d]/g, '') === editingMatricula.cpf.replace(/[^\d]/g, ''))) {
        toast({
          title: 'Erro',
          description: 'Este CPF já está cadastrado em outra matrícula.',
          variant: 'destructive',
        });
        return;
    }
    
    // This part is tricky because we are not directly setting matriculas array anymore.
    // The source of truth is `preMatriculasData`.
    // We need to find the pre-matricula and update its matricula property.
    const preMatriculasData = getPreMatriculas();
    const preMatricula = preMatriculasData.find(p => p.matricula?.id === editingMatricula.id);
    if(preMatricula && preMatricula.matricula) {
        preMatricula.matricula = editingMatricula;
    }

    // Refresh state from source of truth
    setMatriculas(preMatriculasData.filter(p => p.matricula).map(p => p.matricula));

    setIsEditDialogOpen(false);
    setEditingMatricula(null);
    toast({
      title: 'Sucesso!',
      description: 'Matrícula atualizada com sucesso.',
    });
  };

  const handleCreateMatricula = () => {
    const preMatriculasData = getPreMatriculas();
    const cleanCpf = newMatriculaUser.replace(/[^\d]/g, '');
    const preMatricula = preMatriculasData.find(p => p.cpf.replace(/[^\d]/g, '') === cleanCpf);

    if (!preMatricula) {
        toast({
            title: 'Erro',
            description: 'Nenhum aluno de pré-matrícula encontrado com este CPF.',
            variant: 'destructive',
        });
        return;
    }
    
    if (preMatricula.status === 'matriculado' || preMatricula.status === 'aguardando_pagamento') {
        toast({
            title: 'Atenção',
            description: 'Este aluno já possui uma matrícula ativa ou aguardando pagamento.',
            variant: 'destructive',
        });
        return;
    }

    const newMatricula: MatriculaData = {
        id: generateId(),
        nome: preMatricula.nome,
        cpf: preMatricula.cpf,
        whatsapp: preMatricula.whatsapp,
        status: 'aguardando_pagamento',
        maquinas: newMatriculaCurso ? [cursos[newMatriculaCurso]] : [],
        criado: new Date().toLocaleString('pt-BR'),
        horario: newMatriculaHorario
    };

    addMatriculaData(cleanCpf, newMatricula);
    setIsCreateDialogOpen(false);
    
    toast({
        title: 'Sucesso!',
        description: `Matrícula para ${preMatricula.nome} criada. Redirecionando...`,
    });

    router.push(`/matriculas/edit/${newMatricula.id}`);
};


  const handleEditCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingMatricula) {
      const maskedCpf = maskCpf(e.target.value);
      setEditingMatricula({ ...editingMatricula, cpf: maskedCpf });
    }
  };

  const handleEditWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingMatricula) {
      const maskedWhatsapp = maskWhatsapp(e.target.value);
      setEditingMatricula({ ...editingMatricula, whatsapp: maskedWhatsapp });
    }
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const headers = ['#ID', 'Nome', 'Status', 'Máquinas', 'CPF', 'Whatsapp', 'Criado'];
    const rows = sortedMatriculas.map(m => [m.id, m.nome, m.status, m.maquinas.join('; '), m.cpf, m.whatsapp, m.criado].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, 'matriculas.csv', 'text/csv');
  };

  const handleExportExcel = () => {
    const headers = ['#ID', 'Nome', 'Status', 'Máquinas', 'CPF', 'Whatsapp', 'Criado'];
    const rows = sortedMatriculas.map(m => [m.id, m.nome, m.status, m.maquinas.join('; '), m.cpf, m.whatsapp, m.criado].join('\t'));
    const excelContent = [headers.join('\t'), ...rows].join('\n');
    downloadFile(excelContent, 'matriculas.xls', 'application/vnd.ms-excel');
  };
  
  const handleExportPDF = () => {
    const doc = new jsPDF();
    (doc as any).autoTable({
        head: [['#ID', 'Nome', 'Status', 'Máquinas', 'CPF', 'Whatsapp', 'Criado']],
        body: sortedMatriculas.map(m => [m.id, m.nome, m.status, m.maquinas.join('; '), m.cpf, m.whatsapp, m.criado]),
    });
    doc.save('matriculas.pdf');
  };
  
  if (!isClient || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex h-16 shrink-0 items-center border-b bg-card px-4 lg:px-6">
          <div className="flex w-full items-center justify-between">
              <div className='flex items-center gap-4'>
                  <Button variant="outline" size="icon" asChild>
                      <Link href="/">
                      <ArrowLeft className="h-4 w-4" />
                      </Link>
                  </Button>
                  <div className="flex items-center gap-3">
                      <UserPlus className="h-6 w-6 text-primary" />
                      <div>
                      <h1 className="text-lg font-bold">Matrículas</h1>
                      </div>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Se não for franqueado, mostra o seletor de cidades normalmente */}
                {userRole !== 'pessoa' && <CitySelector />}
                {/* Se for franqueado, mostra a cidade fixa */}
                {userRole === 'pessoa' && franqueadoCity && (
                  <span className="font-semibold text-primary">{franqueadoCity}</span>
                )}
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatar ?? "https://placehold.co/36x36.png"} alt="@user" data-ai-hint="man face" />
                  <AvatarFallback>B</AvatarFallback>
                </Avatar>
              </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <CardTitle className='flex items-center gap-2'><UserPlus size={24} /> Matrículas</CardTitle>
                        <div className="flex items-center gap-2">
                           
                            <Button onClick={() => setIsCreateDialogOpen(true)}><Plus size={16} className='mr-2' />Criar</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                       <div className="flex flex-wrap items-center gap-2">
                         <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="search" 
                                placeholder="Buscar por nome, cpf..." 
                                className="h-9 pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                         </div>
                         <Select value={machineFilter} onValueChange={setMachineFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filtrar por máquina..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allCursos.map(curso => (
                                    <SelectItem key={curso} value={curso}>{curso}</SelectItem>
                                ))}
                            </SelectContent>
                         </Select>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filtrar por status..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allStatus.map(status => (
                                    <SelectItem key={status} value={status}>{status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                                ))}
                            </SelectContent>
                         </Select>
                         <Button variant="ghost" onClick={handleClearFilters}>Limpar Filtros</Button>
                       </div>
                       <Separator />
                       <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={handleExportCSV}>CSV</Button>
                                <Button variant="outline" size="sm" onClick={handleExportExcel}>Excel</Button>
                                <Button variant="outline" size="sm" onClick={handleExportPDF}>PDF</Button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-muted-foreground">Mostrando</span>
                                <Select defaultValue="25">
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="500">500</SelectItem>
                                        <SelectItem value="1000">1000</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-sm text-muted-foreground">registros</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <Button variant="ghost" size="sm" onClick={() => requestSort('nome')}>Nome<ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" size="sm" onClick={() => requestSort('status')}>Status<ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" size="sm" onClick={() => requestSort('maquinas' as any)}>Máquinas<ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" size="sm" onClick={() => requestSort('cpf')}>CPF<ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" size="sm" onClick={() => requestSort('whatsapp')}>Whatsapp<ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" size="sm" onClick={() => requestSort('criado')}>Criado<ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                                        </TableHead>
                                        <TableHead>Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {sortedMatriculas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            Nenhum resultado para exibir.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedMatriculas.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.nome}</TableCell>
                                        <TableCell>
                                          <StatusBadge status={item.status} />
                                        </TableCell>
                                        <TableCell>{item.maquinas.join(', ')}</TableCell>
                                        <TableCell>{item.cpf}</TableCell>
                                        <TableCell>{item.whatsapp}</TableCell>
                                        <TableCell>{item.criado}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                            <Button asChild variant="outline" size="icon" className="h-8 w-8">
                                                <a href={`tel:${item.whatsapp.replace(/\D/g, '')}`}>
                                                    <Phone className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button asChild variant="outline" size="icon" className="h-8 w-8">
                                                <a href={`https://wa.me/55${item.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                                    <MessageCircle className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button asChild variant="outline" size="icon" className="h-8 w-8">
                                                <Link href={`/matriculas/edit/${item.id}`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex items-center justify-between">
                             <span className="text-sm text-muted-foreground">Mostrando 0 a 0 de 0 registros</span>
                             <div className="flex gap-2">
                                <Button variant="outline" size="sm">Anterior</Button>
                                <Button variant="outline" size="sm">Próximo</Button>
                             </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Criar Matrícula</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="create-user">*Usuário: <span className="text-muted-foreground">(CPF do aluno pré-matriculado)</span></Label>
                    <Input id="create-user" placeholder="CPF ou email" value={newMatriculaUser} onChange={(e) => setNewMatriculaUser(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="create-curso">Curso (Opcional):</Label>
                    <Select onValueChange={setNewMatriculaCurso} value={newMatriculaCurso}>
                        <SelectTrigger id="create-curso">
                            <SelectValue placeholder="Selecione um curso" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="trator_agricola">TRATOR AGRÍCOLA</SelectItem>
                            <SelectItem value="retroescavadeira">RETROESCAVADEIRA</SelectItem>
                            <SelectItem value="pa_carregadeira">PÁ CARREGADEIRA</SelectItem>
                            <SelectItem value="pacote_completo">PACOTE COMPLETO</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="create-horario">Horário (Opcional):</Label>
                    <Select onValueChange={setNewMatriculaHorario} value={newMatriculaHorario}>
                        <SelectTrigger id="create-horario">
                            <SelectValue placeholder="Selecione um horário" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 7).map(hour => (
                                <SelectItem key={hour} value={`${hour}:00`}>{`${hour}:00`}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="destructive" className="bg-red-500 hover:bg-red-600 text-white">
                        <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                </DialogClose>
                <Button type="button" onClick={handleCreateMatricula} className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Criar e Editar
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>


      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Matrícula</DialogTitle>
            <DialogDescription>
              Faça alterações nos dados da matrícula aqui. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          {editingMatricula && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nome" className="text-right">
                  Nome
                </Label>
                <Input
                  id="edit-nome"
                  value={editingMatricula.nome}
                  onChange={(e) => setEditingMatricula({ ...editingMatricula, nome: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cpf" className="text-right">
                  CPF
                </Label>
                <Input
                  id="edit-cpf"
                  value={editingMatricula.cpf}
                  onChange={handleEditCpfChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-whatsapp" className="text-right">
                  Whatsapp
                </Label>
                <Input
                  id="edit-whatsapp"
                  value={editingMatricula.whatsapp}
                  onChange={handleEditWhatsappChange}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">
                    Cancelar
                </Button>
            </DialogClose>
            <Button type="button" onClick={handleUpdateMatricula}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
