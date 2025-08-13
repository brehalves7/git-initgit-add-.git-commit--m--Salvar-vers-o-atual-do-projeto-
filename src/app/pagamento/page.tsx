
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Search, User, ChevronRight, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getPreMatriculas, updateMatriculaStatus, PreMatriculaData } from '@/app/pre-matriculas/data';
import type { MatriculaData } from '@/app/pre-matriculas/data';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CitySelector } from '@/components/city-selector';

const maskCpf = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .substring(0, 14);
};

export default function PagamentoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cpf, setCpf] = useState('');
  const [preMatricula, setPreMatricula] = useState<PreMatriculaData | null>(null);
  const [matricula, setMatricula] = useState<MatriculaData | null>(null);
  const [step, setStep] = useState<'search' | 'summary' | 'payment'>('search');
  const [valorDinheiro, setValorDinheiro] = useState('');
  const [valorCartao, setValorCartao] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

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

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(maskCpf(e.target.value));
  };
  
  const handleSearch = () => {
    setMatricula(null);
    if (!cpf) {
        toast({
            title: 'Erro',
            description: 'Por favor, informe um CPF.',
            variant: 'destructive',
        });
        return;
    }

    const preMatriculasData = getPreMatriculas();
    const cleanCpf = cpf.replace(/[^\d]/g, '');
    const foundPreMatricula = preMatriculasData.find(p => p.matricula && p.cpf.replace(/[^\d]/g, '') === cleanCpf);

    if (foundPreMatricula?.matricula) {
        if(foundPreMatricula.matricula.status === 'ativo') {
            toast({
                title: 'Atenção',
                description: 'Esta matrícula já está com o pagamento confirmado.',
            });
            return;
        }
        setPreMatricula(foundPreMatricula)
        setMatricula(foundPreMatricula.matricula);
        setStep('summary');
    } else {
        toast({
            title: 'Não encontrado',
            description: 'Nenhuma matrícula encontrada para o CPF informado.',
            variant: 'destructive'
        });
        setStep('search');
    }
  };

  const getCursoPreco = (cursoNome: string | undefined) => {
    if (!cursoNome) return 0;
    switch (cursoNome) {
      case 'PACOTE COMPLETO':
        return 300.00;
      case 'RETROESCAVADEIRA':
      case 'TRATOR AGRÍCOLA':
      case 'PÁ CARREGADEIRA':
        return 150.00;
      default:
        return 0;
    }
  };

  const getTotalPreco = (cursos: string[] | undefined) => {
    if(!cursos) return 0;
    return cursos.reduce((acc, curso) => acc + getCursoPreco(curso), 0);
  }

  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace('.', ',');
  }
  
  const totalAPagar = useMemo(() => {
    return matricula ? getTotalPreco(matricula.maquinas) : 0;
  }, [matricula]);

  const valorRestante = useMemo(() => {
    const pagoDinheiro = parseFloat(valorDinheiro) || 0;
    const pagoCartao = parseFloat(valorCartao) || 0;
    return totalAPagar - pagoDinheiro - pagoCartao;
  }, [totalAPagar, valorDinheiro, valorCartao]);

  const handleConfirmarPagamento = (metodo: 'dinheiro-cartao' | 'pix') => {
    if (!matricula || !preMatricula) return;

    if (metodo === 'dinheiro-cartao') {
        if (valorRestante > 0) {
            toast({
                title: 'Erro',
                description: `Ainda faltam R$ ${formatCurrency(valorRestante)} para completar o pagamento.`,
                variant: 'destructive',
            });
            return;
        }
        if (valorRestante < 0) {
            toast({
                title: 'Erro',
                description: 'O valor pago excede o total da matrícula.',
                variant: 'destructive',
            });
            return;
        }
    }

    const paymentInfo = {
        total: totalAPagar,
        dinheiro: parseFloat(valorDinheiro) || 0,
        cartao: parseFloat(valorCartao) || 0,
        metodo: metodo
    };

    updateMatriculaStatus(preMatricula.local, matricula.id, 'ativo', paymentInfo);

    toast({
        title: 'Sucesso!',
        description: 'Pagamento confirmado e matrícula ativada.',
    });

    // Reset state
    setStep('search');
    setCpf('');
    setMatricula(null);
    setPreMatricula(null);
    setValorDinheiro('');
    setValorCartao('');
};


  if (!isClient || !isAuthenticated) {
    return null; // or a loading spinner
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
              <CreditCard className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-bold">Pagamento</h1>
                <p className="text-sm text-muted-foreground">Confirme a matrícula do aluno</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CitySelector />
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
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Buscar Matrícula</CardTitle>
                <CardDescription>Insira o CPF do aluno para ver os detalhes da matrícula.</CardDescription>
            </CardHeader>
            <CardContent>
                {step === 'search' && (
                    <div className="flex items-center gap-2">
                        <div className="w-full space-y-2">
                            <Label htmlFor="cpf">CPF do Aluno</Label>
                            <Input id="cpf" placeholder="000.000.000-00" value={cpf} onChange={handleCpfChange} />
                        </div>
                        <Button onClick={handleSearch} className="self-end">
                            <Search className="mr-2 h-4 w-4" />
                            Confirmar
                        </Button>
                    </div>
                )}
                
                {step === 'summary' && matricula && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Resumo da Inscrição</h2>
                         <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <User className="h-8 w-8 text-primary" />
                                    <div>
                                        <CardTitle className='text-xl'>{matricula.nome}</CardTitle>
                                        <CardDescription>{matricula.cpf}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {matricula.maquinas.map((maquina, index) => (
                                    <div className="border-t pt-4" key={index}>
                                        <p><span className="font-semibold">Curso:</span> {maquina}</p>
                                        <p><span className="font-semibold">Valor:</span> R$ {formatCurrency(getCursoPreco(maquina))}</p>
                                        <p><span className="font-semibold">Horário:</span> {matricula.horario}</p>
                                    </div>
                                ))}
                                <div className="border-t pt-4 font-bold text-lg text-right">
                                    Total: R$ {formatCurrency(totalAPagar)}
                                </div>
                                <Button onClick={() => setStep('payment')} className="w-full mt-4">
                                    Avançar <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {step === 'payment' && matricula && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Opções de Pagamento</h2>
                    <Tabs defaultValue="dinheiro-cartao">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="dinheiro-cartao"><CreditCard className="mr-2 h-4 w-4"/>Dinheiro/Cartão</TabsTrigger>
                        <TabsTrigger value="pix"><QrCode className="mr-2 h-4 w-4"/>PIX</TabsTrigger>
                      </TabsList>
                      <TabsContent value="dinheiro-cartao">
                        <Card>
                          <CardHeader>
                            <CardTitle>Pagamento em Dinheiro e/ou Cartão</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="valor-dinheiro">Valor em Dinheiro</Label>
                                <Input id="valor-dinheiro" type="number" placeholder="R$ 0,00" value={valorDinheiro} onChange={(e) => setValorDinheiro(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="valor-cartao">Valor no Cartão</Label>
                                <Input id="valor-cartao" type="number" placeholder="R$ 0,00" value={valorCartao} onChange={(e) => setValorCartao(e.target.value)} />
                              </div>
                              <div className="text-right font-semibold">
                                <p>Total: R$ {formatCurrency(totalAPagar)}</p>
                                <p className={valorRestante > 0 ? "text-destructive" : "text-green-600"}>
                                  {valorRestante > 0 ? `Restante: R$ ${formatCurrency(valorRestante)}` : `Troco: R$ ${formatCurrency(Math.abs(valorRestante))}`}
                                </p>
                              </div>
                             <Button className="w-full" onClick={() => handleConfirmarPagamento('dinheiro-cartao')}>Confirmar Pagamento</Button>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      <TabsContent value="pix">
                         <Card>
                          <CardHeader>
                            <CardTitle>Pagamento com PIX</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p>Mostre o QR Code ou a chave PIX para o aluno efetuar o pagamento de R$ {formatCurrency(totalAPagar)}.</p>
                            <Button className="w-full" onClick={() => handleConfirmarPagamento('pix')}>Confirmar Pagamento</Button>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                    <Button variant="link" size="sm" onClick={() => setStep('summary')} className="mt-4">Voltar para o resumo</Button>
                  </div>
                )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
