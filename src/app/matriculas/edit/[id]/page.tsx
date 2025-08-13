
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Ticket, HelpCircle, AlertTriangle, RefreshCw, Save, Plus, Clock, MessageSquare, CreditCard, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPreMatriculas, savePreMatriculas } from '@/app/pre-matriculas/data';
import type { MatriculaData } from '@/app/pre-matriculas/data';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';
import { CitySelector } from '@/components/city-selector';


export default function EditMatriculaPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();

  const [matricula, setMatricula] = useState<MatriculaData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [novoCurso, setNovoCurso] = useState<string>('');
  const [cursoAdicional, setCursoAdicional] = useState<string>('');
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
  
  useEffect(() => {
    if (id && isClient) {
        const preMatriculasData = getPreMatriculas();
        const foundMatricula = preMatriculasData.find(p => p.matricula?.id === id)?.matricula;
        if (foundMatricula) {
            setMatricula(foundMatricula);
        } else {
            // Handle not found, maybe redirect or show an error
        }
    }
  }, [id, isClient]);

  useEffect(() => {
    if (isClient) {
        const handleMatriculaAtualizada = () => {
            if (id) {
                const preMatriculasData = getPreMatriculas();
                const preMatricula = preMatriculasData.find(p => p.matricula?.id === id);
                if(preMatricula && preMatricula.matricula) {
                  setMatricula({ ...preMatricula.matricula });
                }
            }
        };
        window.addEventListener('matriculaAtualizada', handleMatriculaAtualizada);
        return () => {
            window.removeEventListener('matriculaAtualizada', handleMatriculaAtualizada);
        };
    }
  }, [id, isClient]);

  const handleMudarCurso = () => {
    if (!novoCurso) {
        toast({
            title: 'Erro',
            description: 'Por favor, selecione um curso para fazer a mudança.',
            variant: 'destructive',
        });
        return;
    }
    if (matricula) {
        const preMatriculasData = getPreMatriculas();
        const preMatricula = preMatriculasData.find(p => p.matricula?.id === matricula.id);
        if (preMatricula && preMatricula.matricula) {
            preMatricula.matricula.maquinas = [novoCurso]; // This assumes changing the course replaces all existing ones.
            savePreMatriculas(preMatriculasData);
            setMatricula({ ...preMatricula.matricula }); // Update local state to reflect change
            toast({
                title: 'Sucesso!',
                description: 'O curso foi alterado com sucesso.',
            });
        }
    }
  };

  const handleAdicionarCurso = () => {
    if (!cursoAdicional) {
        toast({
            title: 'Erro',
            description: 'Por favor, selecione um curso para adicionar.',
            variant: 'destructive',
        });
        return;
    }
    if (matricula) {
        const preMatriculasData = getPreMatriculas();
        const preMatricula = preMatriculasData.find(p => p.matricula?.id === matricula.id);
        if (preMatricula && preMatricula.matricula) {
            if (preMatricula.matricula.maquinas.includes(cursoAdicional)) {
                toast({
                    title: 'Atenção',
                    description: 'Este curso já foi adicionado.',
                    variant: 'destructive'
                });
                return;
            }
            preMatricula.matricula.maquinas.push(cursoAdicional);
            // Salvamento automático: garantir cidade correta
            savePreMatriculas(preMatricula.local, preMatriculasData);
            setMatricula({ ...preMatricula.matricula }); // Update local state
            setCursoAdicional(''); // Reset select
            toast({
                title: 'Sucesso!',
                description: 'Curso adicional adicionado e salvo automaticamente.',
            });
        }
    }
  };

const handleHorarioChange = (value: string) => {
    if (matricula) {
        const preMatriculasData = getPreMatriculas();
        const preMatricula = preMatriculasData.find(p => p.matricula?.id === matricula.id);
        if (preMatricula && preMatricula.matricula) {
            preMatricula.matricula.horario = value;
            savePreMatriculas(preMatriculasData);
            setMatricula({ ...preMatricula.matricula });
            toast({
                title: 'Sucesso!',
                description: 'Horário da matrícula atualizado.',
            });
        }
    }
  };

  const handleEnviarWhatsapp = () => {
    if (matricula && matricula.whatsapp) {
      const numeroWhatsapp = matricula.whatsapp.replace(/\D/g, '');
      const mensagem = `Olá! Tudo bem? 😊 Este é um lembrete que sua aula prática já está agendado(a) no curso de Máquinas Pesadas. ⏰ Pedimos que chegue no horário marcado, pois nossas aulas iniciam pontualmente. O curso é bem dinâmico e cada parte é fundamental para seu aprendizado, então atrasos podem fazer você perder explicações importantes e até parte da prática. Chegando no horário, você garante: ✅ Melhor aproveitamento do conteúdo ✅ Participar de todas as atividades práticas ✅ Tirar dúvidas com calma e aproveitar o suporte do instrutor. Contamos com sua presença e pontualidade para que sua experiência seja a melhor possível. Nos vemos no curso! 🚜💪`;
      const url = `https://wa.me/55${numeroWhatsapp}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, '_blank');
    } else {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem. Verifique o número de WhatsApp.',
        variant: 'destructive',
      });
    }
  };

  const getCursoPreco = (cursoNome: string | undefined) => {
    if (!cursoNome) return '0,00';
    switch (cursoNome) {
      case 'PACOTE COMPLETO':
        return '300,00';
      case 'RETROESCAVADEIRA':
      case 'TRATOR AGRÍCOLA':
      case 'PÁ CARREGADEIRA':
        return '150,00';
      default:
        return '0,00';
    }
  };

  const getTotalPreco = (cursos: string[] | undefined) => {
    if(!cursos) return '0,00';
    const total = cursos.reduce((acc, curso) => acc + parseFloat(getCursoPreco(curso).replace(',', '.')), 0);
    return total.toFixed(2).replace('.', ',');
  }

  const formatPayment = (payment: MatriculaData['pagamento'] | undefined) => {
    if (!payment) return 'PÓS PAGO | SEM FORMA DE PAGAMENTO';
    const dinheiro = payment.dinheiro > 0 ? `Dinheiro: R$ ${payment.dinheiro.toFixed(2).replace('.',',')}` : '';
    const cartao = payment.cartao > 0 ? `Cartão: R$ ${payment.cartao.toFixed(2).replace('.',',')}`: '';
    return `Total: R$ ${payment.total.toFixed(2).replace('.',',')} / ${[dinheiro, cartao].filter(Boolean).join(' / ')}`;
  };
  
    const handleGerarCertificado = () => {
    if (!matricula) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Simple certificate design
    doc.setFontSize(40);
    doc.text('CERTIFICADO DE CONCLUSÃO', doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });

    doc.setFontSize(20);
    doc.text('Certificamos que', doc.internal.pageSize.getWidth() / 2, 90, { align: 'center' });

    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.text(matricula.nome, doc.internal.pageSize.getWidth() / 2, 110, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(20);
    doc.text('concluiu com sucesso o curso de', doc.internal.pageSize.getWidth() / 2, 130, { align: 'center' });

    doc.setFontSize(25);
    doc.setFont('helvetica', 'bold');
    doc.text(matricula.maquinas.join(', '), doc.internal.pageSize.getWidth() / 2, 150, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, doc.internal.pageSize.getWidth() / 2, 180, { align: 'center' });


    doc.save(`certificado-${matricula.nome.toLowerCase().replace(/ /g, '-')}.pdf`);

    toast({
        title: 'Sucesso!',
        description: 'Certificado gerado e o download foi iniciado.',
    });
  };

  if (!isClient || !isAuthenticated) {
    return null; // or a loading spinner
  }

  if (!matricula) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <p>Matrícula não encontrada.</p>
        </div>
    )
  }

  const isAtivo = matricula.status === 'ativo';

  return (
    <div className="flex min-h-screen flex-col bg-background">
        <header className="flex h-16 shrink-0 items-center border-b bg-card px-4 lg:px-6">
          <div className="flex w-full items-center justify-between">
              <div className='flex items-center gap-4'>
                  <Button variant="outline" size="icon" asChild>
                      <Link href="/matriculas">
                      <ArrowLeft className="h-4 w-4" />
                      </Link>
                  </Button>
              </div>
              <div className="flex items-center gap-4">
                <CitySelector />
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
                    <div className="flex items-center gap-3">
                        <Ticket className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle className='text-2xl'>Editar Inscrição</CardTitle>
                            <div className='flex items-center gap-2 mt-1 flex-wrap'>
                                <span className='font-semibold'>{matricula.nome}</span>
                                {isAtivo ? (
                                    <Badge className="bg-green-100 text-green-800 uppercase">Ativo</Badge>
                                ) : (
                                    <Badge variant="outline" className='border-yellow-500 text-yellow-500 uppercase'>Aguardando Pagamento</Badge>
                                )}
                                <span className='text-sm text-muted-foreground'>{formatPayment(matricula.pagamento)}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="cursos">
                        <TabsList>
                            <TabsTrigger value="usuario">Usuário</TabsTrigger>
                            <TabsTrigger value="cursos">Cursos</TabsTrigger>
                            {isAtivo && <TabsTrigger value="certificado">Certificado</TabsTrigger>}
                        </TabsList>
                        <TabsContent value="usuario">
                           <Card className="mt-4 border-0 shadow-none">
                                <CardContent className="pt-6">
                                    <div className="grid gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="nome">Nome</Label>
                                                <Input id="nome" value={matricula.nome} readOnly />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cpf">CPF</Label>
                                                <Input id="cpf" value={matricula.cpf} readOnly />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="curso">Curso(s)</Label>
                                            <Input id="curso" value={matricula.maquinas.join(', ')} readOnly />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="cursos">
                            <div className="mt-4 space-y-8">
                                <Card className="border-0 shadow-none">
                                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold flex items-center gap-2">Mudar de curso <HelpCircle className='h-4 w-4 text-muted-foreground' /></h3>
                                            <div className='space-y-2'>
                                                <Label>*Selecione um curso:</Label>
                                                <Select onValueChange={setNovoCurso}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione um curso" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="TRATOR AGRÍCOLA">TRATOR AGRÍCOLA</SelectItem>
                                                        <SelectItem value="RETROESCAVADEIRA">RETROESCAVADEIRA</SelectItem>
                                                        <SelectItem value="PÁ CARREGADEIRA">PÁ CARREGADEIRA</SelectItem>
                                                        <SelectItem value="PACOTE COMPLEto">PACOTE COMPLETO</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button className='bg-green-600 hover:bg-green-700 text-white' onClick={handleMudarCurso}><RefreshCw className='mr-2 h-4 w-4' /> Fazer mudança</Button>
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="font-semibold flex items-center gap-2">Cursos adicionais <HelpCircle className='h-4 w-4 text-muted-foreground' /></h3>
                                            <div className='space-y-2'>
                                                <Label>*Selecione um curso:</Label>
                                                <Select onValueChange={setCursoAdicional} value={cursoAdicional}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione um curso" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="TRATOR AGRÍCOLA">TRATOR AGRÍCOLA</SelectItem>
                                                        <SelectItem value="RETROESCAVADEIRA">RETROESCAVADEIRA</SelectItem>
                                                        <SelectItem value="PÁ CARREGADEIRA">PÁ CARREGADEIRA</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button className='bg-green-600 hover:bg-green-700 text-white' onClick={handleAdicionarCurso}><Plus className='mr-2 h-4 w-4' /> Adicionar</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-none">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Clock className="h-5 w-5" />
                                            Horário da Matrícula
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4 max-w-xs">
                                            <div className="space-y-2">
                                                <Label>Alterar Horário</Label>
                                                <Select onValueChange={handleHorarioChange} value={matricula.horario}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione um horário" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from({ length: 12 }, (_, i) => i + 7).map(hour => (
                                                            <SelectItem key={hour} value={`${hour}:00`}>{`${hour}:00`}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button onClick={handleEnviarWhatsapp} variant="outline" className="w-full text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                                                <MessageSquare className="mr-2 h-4 w-4" />
                                                Enviar Confirmação
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Itens da inscrição</h2>
                                    <Separator />
                                    {matricula.maquinas.map((maquina, index) => (
                                        <Card className="mt-4" key={index}>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">Informações</CardTitle>
                                                {index === 0 && <Badge className="bg-yellow-400 text-yellow-900">Principal</Badge>}
                                            </CardHeader>
                                            <CardContent className="space-y-3 text-sm">
                                                <p><span className="font-semibold">Curso/Pacote:</span> {maquina}</p>
                                                <p><span className="font-semibold">Inscrito em:</span> {matricula.criado}</p>
                                                <p><span className="font-semibold">Total do item:</span> R$ {getCursoPreco(maquina)}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">Ativo:</span>
                                                    <Badge className={isAtivo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                                        {isAtivo ? 'Sim' : 'Não'}
                                                    </Badge>
                                                </div>
                                                <p><span className="font-semibold">Concluído em:</span> ---</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    <Card className="mt-4 bg-secondary">
                                        <CardContent className="pt-6">
                                            <p className="font-bold text-lg text-right">Total: R$ {getTotalPreco(matricula.maquinas)}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>
                         {isAtivo && (
                          <TabsContent value="certificado">
                              <Card className="mt-4 border-0 shadow-none">
                                  <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2">
                                          <Award className="h-5 w-5" />
                                          Certificado
                                      </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                      <p>O aluno concluiu o curso e está apto para receber o certificado.</p>
                                      <Button className="mt-4" onClick={handleGerarCertificado}>Gerar Certificado</Button>
                                  </CardContent>
                              </Card>
                          </TabsContent>
                        )}
                    </Tabs>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
