
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Landmark, List, ShoppingCart, Plus, Trash2, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getPreMatriculas } from '@/app/pre-matriculas/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { MatriculaData, PreMatriculaData } from '@/app/pre-matriculas/data';
import { CitySelector } from '@/components/city-selector';


interface Gasto {
    id: number;
    descricao: string;
    valor: number;
    data: string;
  }

export default function ResumoCaixaPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gastoDescricao, setGastoDescricao] = useState('');
  const [gastoValor, setGastoValor] = useState('');
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const { toast } = useToast();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [preMatriculas, setPreMatriculas] = useState<PreMatriculaData[]>([]);
  const [isClient, setIsClient] = useState(false);

  const getGastosStorageKey = (city: string) => `gastos_${city}`;

  const refreshData = (city: string) => {
    const savedGastos = localStorage.getItem(getGastosStorageKey(city));
    if (savedGastos) {
      setGastos(JSON.parse(savedGastos));
    } else {
      setGastos([]);
    }
    setPreMatriculas(getPreMatriculas(city));
  };


  useEffect(() => {
    setIsClient(true);
    const authStatus = sessionStorage.getItem('isAuthenticated') === 'true';
    if (!authStatus) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
       const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }
    }
  }, [router]);
  
  useEffect(() => {
    if (isAuthenticated && selectedCity && isClient) {
      refreshData(selectedCity);
    }
  }, [isAuthenticated, selectedCity, isClient]);

  useEffect(() => {
    if (isAuthenticated && selectedCity && isClient) {
        localStorage.setItem(getGastosStorageKey(selectedCity), JSON.stringify(gastos));
    }
  }, [gastos, isAuthenticated, selectedCity, isClient]);
  
  useEffect(() => {
    if (isClient) {
      const handleMatriculaAtualizada = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail.city === selectedCity) {
          refreshData(selectedCity);
        }
      };
      window.addEventListener('matriculaAtualizada', handleMatriculaAtualizada);

      return () => {
        window.removeEventListener('matriculaAtualizada', handleMatriculaAtualizada);
      };
    }
  }, [selectedCity, isClient]);


  const totalReceita = useMemo(() => {
    return preMatriculas
      .filter(p => p.matricula && p.matricula.status === 'ativo' && p.matricula.pagamento)
      .reduce((acc, p) => acc + (p.matricula?.pagamento?.total || 0), 0);
  }, [preMatriculas]);
  
  const totalGastos = useMemo(() => {
    return gastos.reduce((acc, gasto) => acc + gasto.valor, 0);
  }, [gastos]);

  const saldoFinal = useMemo(() => {
    return totalReceita - totalGastos;
  }, [totalReceita, totalGastos]);

  const valorDoRepasse = useMemo(() => {
    return saldoFinal * 0.5;
  }, [saldoFinal]);


  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSalvarGasto = (e: React.FormEvent) => {
    e.preventDefault();
    if(!gastoDescricao || !gastoValor) {
        toast({
            title: 'Erro',
            description: 'Por favor, preencha a descrição e o valor do gasto.',
            variant: 'destructive',
        });
        return;
    }
    
    const novoGasto: Gasto = {
        id: Date.now(),
        descricao: gastoDescricao,
        valor: parseFloat(gastoValor),
        data: new Date().toLocaleString('pt-BR'),
    };

    setGastos(prevGastos => [novoGasto, ...prevGastos]);

    toast({
        title: 'Sucesso!',
        description: 'Gasto salvo com sucesso.',
    });
    setGastoDescricao('');
    setGastoValor('');
  }

  const handleExcluirGasto = (id: number) => {
    setGastos(gastos.filter(gasto => gasto.id !== id));
    toast({
        title: 'Sucesso',
        description: 'Gasto excluído com sucesso.',
    });
  }

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleExportGastosExcel = () => {
    const headers = ['Data e Hora', 'Descrição', 'Valor'];
    const rows = gastos.map(g => [g.data, g.descricao, formatCurrency(g.valor)].join('\t'));
    const excelContent = [headers.join('\t'), ...rows].join('\n');
    downloadFile(excelContent, 'gastos.xls', 'application/vnd.ms-excel');
  };
  
  const handleExportGastosPDF = () => {
    const doc = new jsPDF();
    (doc as any).autoTable({
        head: [['Data e Hora', 'Descrição', 'Valor']],
        body: gastos.map(g => [g.data, g.descricao, formatCurrency(g.valor)]),
    });
    doc.save('gastos.pdf');
  };

  const formatPaymentDetails = (payment?: MatriculaData['pagamento']) => {
    if (!payment) return 'N/A';
  
    const { metodo, dinheiro, cartao } = payment;
  
    switch (metodo) {
      case 'dinheiro':
        return 'Dinheiro';
      case 'cartao':
        return 'Cartão';
      case 'pix':
        return 'PIX';
      case 'dinheiro-cartao':
        const details = [];
        if (dinheiro > 0) details.push(`Dinheiro: ${formatCurrency(dinheiro)}`);
        if (cartao > 0) details.push(`Cartão: ${formatCurrency(cartao)}`);
        return details.join(' / ');
      default:
        return 'N/A';
    }
  };

  const receitas = useMemo(() => {
    return preMatriculas.filter(p => p.matricula && p.matricula.status === 'ativo' && p.matricula.pagamento);
  }, [preMatriculas]);

  const handleExportReceitaExcel = () => {
    const headers = ['Aluno', 'Curso', 'Data Pagamento', 'Forma de Pagamento', 'Valor'];
    const rows = receitas.map(r => [
        r.matricula!.nome,
        r.matricula!.maquinas.join(', '),
        r.matricula!.criado,
        formatPaymentDetails(r.matricula!.pagamento),
        formatCurrency(r.matricula!.pagamento!.total)
    ].join('\t'));
    const excelContent = [headers.join('\t'), ...rows].join('\n');
    downloadFile(excelContent, 'receitas.xls', 'application/vnd.ms-excel');
  };
  
  const handleExportReceitaPDF = () => {
    const doc = new jsPDF();
    (doc as any).autoTable({
        head: [['Aluno', 'Curso', 'Data Pagamento', 'Forma de Pagamento', 'Valor']],
        body: receitas.map(r => [
            r.matricula!.nome,
            r.matricula!.maquinas.join(', '),
            r.matricula!.criado,
            formatPaymentDetails(r.matricula!.pagamento),
            formatCurrency(r.matricula!.pagamento!.total)
        ]),
    });
    doc.save('receitas.pdf');
  };

  if (!isClient || !isAuthenticated) {
    return null; 
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center border-b bg-card px-4 lg:px-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <Landmark className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-bold">Resumo de Caixa</h1>
                <p className="text-sm text-muted-foreground">Gerencie suas finanças</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CitySelector onCityChange={setSelectedCity} />
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={avatar ?? "https://placehold.co/36x36.png"}
                alt="@user"
                data-ai-hint="man face"
              />
              <AvatarFallback>B</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                    <span className="text-muted-foreground">R$</span>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(totalReceita)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gastos Totais</CardTitle>
                    <span className="text-muted-foreground">R$</span>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(totalGastos)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saldo Final</CardTitle>
                    <span className="text-muted-foreground">R$</span>
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${saldoFinal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(saldoFinal)}
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="mt-6">
            <Tabs defaultValue="gastos">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="receita"><List className="mr-2 h-4 w-4"/>Receita</TabsTrigger>
                    <TabsTrigger value="gastos"><ShoppingCart className="mr-2 h-4 w-4"/>Gastos</TabsTrigger>
                    <TabsTrigger value="repasse"><Percent className="mr-2 h-4 w-4"/>Repasse</TabsTrigger>
                </TabsList>
                <TabsContent value="receita">
                    <Card className="mt-4">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Detalhes da Receita</CardTitle>
                                    <CardDescription>Lista de todos os pagamentos de matrículas confirmadas.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleExportReceitaPDF}>PDF</Button>
                                    <Button variant="outline" size="sm" onClick={handleExportReceitaExcel}>Excel</Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Aluno</TableHead>
                                        <TableHead>Curso</TableHead>
                                        <TableHead>Data Pagamento</TableHead>
                                        <TableHead>Forma de Pagamento</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {receitas.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">Nenhuma receita registrada.</TableCell>
                                        </TableRow>
                                    ) : (
                                    receitas.map(p => (
                                        <TableRow key={p.matricula!.id}>
                                            <TableCell>{p.matricula!.nome}</TableCell>
                                            <TableCell>{p.matricula!.maquinas.join(', ')}</TableCell>
                                            <TableCell>{p.matricula!.criado}</TableCell>
                                            <TableCell>{formatPaymentDetails(p.matricula!.pagamento)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(p.matricula!.pagamento!.total)}</TableCell>
                                        </TableRow>
                                    )))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="gastos">
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Adicionar Gasto</CardTitle>
                            <CardDescription>Registre um novo gasto.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSalvarGasto} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gasto-descricao">Descrição do Gasto</Label>
                                    <Textarea 
                                        id="gasto-descricao" 
                                        placeholder="Ex: Compra de material de escritório" 
                                        value={gastoDescricao}
                                        onChange={(e) => setGastoDescricao(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gasto-valor">Valor</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                                        <Input 
                                            id="gasto-valor" 
                                            type="number" 
                                            placeholder="0.00"
                                            step="0.01"
                                            className="pl-8"
                                            value={gastoValor}
                                            onChange={(e) => setGastoValor(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full sm:w-auto">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Salvar Gasto
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    <Separator className="my-6" />
                    <Card className="mt-4">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Histórico de Gastos</CardTitle>
                                    <CardDescription>Lista de todos os gastos registrados.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleExportGastosPDF}>PDF</Button>
                                    <Button variant="outline" size="sm" onClick={handleExportGastosExcel}>Excel</Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data e Hora</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gastos.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                Nenhum gasto registrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        gastos.map((gasto) => (
                                            <TableRow key={gasto.id}>
                                                <TableCell>{gasto.data}</TableCell>
                                                <TableCell>{gasto.descricao}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(gasto.valor)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleExcluirGasto(gasto.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="repasse">
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Cálculo de Repasse</CardTitle>
                            <CardDescription>Valor a ser repassado com base no saldo final.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                                <span className="font-medium">Saldo Final</span>
                                <span className={`font-bold ${saldoFinal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(saldoFinal)}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                                <span className="font-medium">Porcentagem de Repasse</span>
                                <span className="font-bold text-muted-foreground">- 50%</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center p-4 rounded-lg bg-secondary">
                                <span className="text-lg font-bold">Valor do Repasse</span>
                                <span className={`text-xl font-bold ${valorDoRepasse >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(valorDoRepasse)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </main>
    </div>
  );
}
