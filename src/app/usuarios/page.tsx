
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getUsers, addUser, updateUser, deleteUser, UserData } from './data';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
  } from '@/components/ui/dialog';
  import { getCities, City } from '@/app/cidades/data';
  import { createUserWithEmailAndPassword } from 'firebase/auth';
  import { auth, db } from '@/lib/firebase';
  import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
  import { CitySelector } from '@/components/city-selector';


export default function UsuariosPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState('');
    const [franqueadoCity, setFranqueadoCity] = useState<string | null>(null);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [isClient, setIsClient] = useState(false);

  const [users, setUsers] = useState<UserData[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserData['role']>('pessoa');
  const [userCity, setUserCity] = useState('');


  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);

        useEffect(() => {
            setIsClient(true);
            const authStatus = sessionStorage.getItem('isAuthenticated') === 'true';
            const roleFromSession = sessionStorage.getItem('userRole');
            if (!authStatus) {
                    toast({ title: "Acesso Negado", description: "Você precisa estar logado para acessar esta página.", variant: "destructive" });
                    router.push('/');
            } else {
                    setIsAuthenticated(true);
                    setUserRole(roleFromSession);
                    const savedAvatar = localStorage.getItem('userAvatar');
                    if (savedAvatar) setAvatar(savedAvatar);
                    setAllCities(getCities());
                    // Se for franqueado, pega a cidade do cadastro dele e trava tudo nela
                    if (roleFromSession === 'pessoa') {
                            // Busca usuário logado pelo e-mail salvo na sessão
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
                                setSelectedCity(user.city);
                                localStorage.setItem('selectedCity', user.city);
                            }
                    } else {
                            // Para outros perfis, seleciona a cidade salva ou padrão
                            const savedCity = localStorage.getItem('selectedCity');
                            if (savedCity) setSelectedCity(savedCity);
                    }
            }
        }, [router, toast]);
  
  useEffect(() => {
    if (selectedCity && isClient) {
        setUsers(getUsers(selectedCity));
    }
  }, [selectedCity, isClient]);
  
  useEffect(() => {
    if (isClient) {
        const handleUsersChanged = (event: Event) => {
            const customEvent = event as CustomEvent;
            if(customEvent.detail.city === selectedCity) {
                setUsers(getUsers(selectedCity));
            }
        };
        window.addEventListener('usersDataChanged', handleUsersChanged);
        return () => window.removeEventListener('usersDataChanged', handleUsersChanged);
    }
  }, [selectedCity, isClient]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCity) {
        toast({ title: "Erro", description: "Por favor, selecione uma cidade para o usuário.", variant: "destructive" });
        return;
    }
    if (!email.endsWith('@gcscursos.com.br')) {
        toast({ title: "Erro de Validação", description: "O e-mail deve terminar com @gcscursos.com.br", variant: "destructive" });
        return;
    }
    const cityUsers = getUsers(userCity);
    if (cityUsers.some(u => u.email === email)) {
        toast({ title: "Erro", description: "Este e-mail já está em uso nesta cidade.", variant: "destructive" });
        return;
    }
    // Criação local apenas
    const newId = Date.now().toString();
    addUser(userCity, { name, email, role, password, id: newId });
    if(userCity === selectedCity) {
        setUsers(getUsers(userCity));
    }
    toast({ title: "Sucesso!", description: "Usuário criado localmente com sucesso." });
    setName('');
    setEmail('');
    setPassword('');
    setRole('pessoa');
    setUserCity('');
  };

  const handleEditClick = (user: UserData) => {
    setEditingUser({ ...user, password: '' }); 
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !selectedCity) return;

    if (!editingUser.email.endsWith('@gcscursos.com.br')) {
        toast({ title: "Erro de Validação", description: "O e-mail deve terminar com @gcscursos.com.br", variant: "destructive" });
        return;
    }

    if (users.some(u => u.email === editingUser.email && u.id !== editingUser.id)) {
        toast({ title: "Erro", description: "O e-mail informado já está em uso por outro usuário nesta cidade.", variant: "destructive" });
        return;
    }
    
    try {
        const { id, ...updateData } = editingUser;
        const userDocRef = doc(db, "users", id);

        const firestoreUpdateData: any = {
            name: updateData.name,
            email: updateData.email,
            role: updateData.role,
        };
        
        await updateDoc(userDocRef, firestoreUpdateData);

        const dataToUpdate: Partial<Omit<UserData, 'id' | 'createdAt'>> = {
            name: updateData.name,
            email: updateData.email,
            role: updateData.role,
        };
        
        if (updateData.password) {
            dataToUpdate.password = updateData.password;
        }

        updateUser(selectedCity, id, dataToUpdate);
        setUsers(getUsers(selectedCity));

        toast({ title: "Sucesso!", description: "Usuário atualizado com sucesso." });
        setIsEditDialogOpen(false);
        setEditingUser(null);
    } catch (error) {
        console.error("Error updating user: ", error);
        toast({ title: "Erro", description: "Não foi possível atualizar o usuário.", variant: "destructive" });
    }
  };

  const handleDeleteClick = (user: UserData) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser || !selectedCity) return;
    
    try {
        // IMPORTANT: Firebase Auth user deletion requires re-authentication.
        // A robust solution uses a backend function with Admin SDK privileges.
        // We will just delete from firestore and local storage for this app.
        await deleteDoc(doc(db, "users", deletingUser.id));

        // Now remove from local data
        deleteUser(selectedCity, deletingUser.id);
        setUsers(getUsers(selectedCity));

        toast({ title: "Sucesso!", description: `Usuário "${deletingUser.name}" excluído.` });
    } catch (error: any) {
        console.error("Error deleting user: ", error);
        let description = "Não foi possível excluir o usuário do Firestore."
        if (error.code === "auth/requires-recent-login") {
            description = "Esta é uma operação sensível. Por favor, faça login novamente para excluir o usuário."
        }
        toast({ title: "Erro", description, variant: "destructive" });
    } finally {
        setIsDeleteDialogOpen(false);
        setDeletingUser(null);
    }
  };

  const getRoleBadgeVariant = (role: UserData['role']) => {
    switch (role) {
      case 'mestre': return 'destructive';
      case 'pessoa': return 'secondary';
      case 'aluno': return 'default';
      case 'limitado': return 'outline';
      default: return 'default';
    }
  }

  const getRoleName = (role: UserData['role']) => {
    switch (role) {
        case 'mestre': return 'Mestre';
        case 'pessoa': return 'Franqueado';
        case 'aluno': return 'Aluno';
        case 'limitado': return 'Limitado';
        default: return 'N/A';
    }
  }


    if (!isClient || !isAuthenticated) {
        return null;
    }

  return (
    <>
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
                <Users className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-lg font-bold">Gerenciar Usuários</h1>
                  <p className="text-sm text-muted-foreground">Adicione, edite e remova usuários</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
                {/* Se não for franqueado, mostra o seletor de cidades normalmente */}
                {userRole !== 'pessoa' && (
                    <CitySelector onCityChange={setSelectedCity} />
                )}
                {/* Se for franqueado, mostra a cidade fixa e nunca o seletor */}
                {userRole === 'pessoa' && franqueadoCity && (
                    <span className="font-semibold text-primary">{franqueadoCity}</span>
                )}
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
        <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu de adicionar usuário: só aparece se não for franqueado */}
          {userRole !== 'pessoa' && (
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Adicionar Novo Usuário</CardTitle>
                        <CardDescription>Crie um novo perfil de acesso ao sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="email@gcscursos.com.br" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                  <Label htmlFor="user-city">Cidade</Label>
                                  <Select onValueChange={setUserCity} value={userCity}>
                                      <SelectTrigger id="user-city">
                                          <SelectValue placeholder="Selecione uma cidade" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {allCities.map(city => (
                                              <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Perfil de Acesso</Label>
                                <Select onValueChange={(v: UserData['role']) => setRole(v)} value={role}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o perfil" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mestre">Mestre</SelectItem>
                                        <SelectItem value="pessoa">Franqueado</SelectItem>
                                        <SelectItem value="limitado">Limitado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full">
                                <Plus className="mr-2 h-4 w-4" /> Criar Usuário
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
          )}
          <div className="lg:col-span-2">
              <Card>
                  <CardHeader>
                      <CardTitle>Usuários Cadastrados</CardTitle>
                      <CardDescription>Lista de todos os usuários com acesso ao sistema na cidade de <span className="font-semibold">{selectedCity || "Nenhuma"}</span>.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="overflow-x-auto rounded-md border">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Nome</TableHead>
                                      <TableHead>Email</TableHead>
                                      <TableHead>Perfil</TableHead>
                                      <TableHead>Criado em</TableHead>
                                      <TableHead className="text-right">Ações</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {users.length === 0 ? (
                                      <TableRow>
                                          <TableCell colSpan={5} className="h-24 text-center">Nenhum usuário cadastrado.</TableCell>
                                      </TableRow>
                                  ) : (
                                      users.map(user => (
                                          <TableRow key={user.id}>
                                              <TableCell className="font-medium">{user.name}</TableCell>
                                              <TableCell>{user.email}</TableCell>
                                              <TableCell>
                                                  <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleName(user.role)}</Badge>
                                              </TableCell>
                                              <TableCell>{new Date(user.createdAt).toLocaleString('pt-BR')}</TableCell>
                                              <TableCell className="text-right">
                                                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                                                      <Edit className="h-4 w-4" />
                                                  </Button>
                                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user)}>
                                                      <Trash2 className="h-4 w-4 text-destructive" />
                                                  </Button>
                                              </TableCell>
                                          </TableRow>
                                      ))
                                  )}
                              </TableBody>
                          </Table>
                      </div>
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Editar Usuário</DialogTitle>
                  <DialogDescription>
                      Altere os dados do usuário. Clique em salvar para aplicar as mudanças.
                  </DialogDescription>
              </DialogHeader>
              {editingUser && (
              <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="edit-name">Nome</Label>
                      <Input id="edit-name" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input id="edit-email" type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="edit-password">Nova Senha</Label>
                      <Input id="edit-password" type="password" placeholder="Deixe em branco para manter a atual" value={editingUser.password ?? ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="edit-role">Perfil de Acesso</Label>
                      <Select onValueChange={(v: UserData['role']) => setEditingUser({...editingUser, role: v})} value={editingUser.role}>
                          <SelectTrigger>
                              <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="mestre">Mestre</SelectItem>
                              <SelectItem value="pessoa">Franqueado</SelectItem>
                              <SelectItem value="limitado">Limitado</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              )}
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="secondary">Cancelar</Button>
                  </DialogClose>
                  <Button type="button" onClick={handleUpdateUser}>Salvar Alterações</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso irá excluir permanentemente o usuário
                  <span className="font-bold"> {deletingUser?.name}</span> do sistema.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
