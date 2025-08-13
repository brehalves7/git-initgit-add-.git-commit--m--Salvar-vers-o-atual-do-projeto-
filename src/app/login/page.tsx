
'use client';

import { useState } from 'react';
import { getUsers } from '../usuarios/data';
import { useRouter } from 'next/navigation';
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { doc, getDoc } from 'firebase/firestore';
// import { auth, db } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      const errorMessage = "Por favor, preencha o e-mail e a senha.";
      setError(errorMessage);
      toast({
        title: 'Campos obrigatórios',
        description: errorMessage,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      // Se for o e-mail principal, libera acesso total como mestre
      if (email === 'brayan@mestre.com' && password === '84407257') {
        sessionStorage.setItem('userRole', 'mestre');
        sessionStorage.setItem('userName', 'Brayan Mestre');
        sessionStorage.setItem('isAuthenticated', 'true');
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando para o painel...',
        });
        router.push('/');
        return;
      }
      // Busca usuários locais de todas as cidades
      let allUsers: any[] = [];
      const keys = Object.keys(localStorage).filter(k => k.startsWith('usersData_'));
      for (const key of keys) {
        try {
          const users = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(users)) allUsers = allUsers.concat(users);
        } catch {}
      }
      const user = allUsers.find(u => u.email === email && u.password === password);
      if (!user) {
        throw new Error('E-mail ou senha incorretos. Verifique suas credenciais.');
      }
      sessionStorage.setItem('userRole', user.role || 'aluno');
      sessionStorage.setItem('userName', user.name || 'Usuário');
      sessionStorage.setItem('isAuthenticated', 'true');
      toast({
        title: 'Login bem-sucedido!',
        description: 'Redirecionando para o painel...',
      });
      router.push('/');
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || 'E-mail ou senha incorretos. Verifique suas credenciais.';
      setError(errorMessage);
      toast({
        title: 'Erro de login',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="text-center">
          <Image
            src="/logo.png"
            alt="GCS Cursos"
            width={80}
            height={80}
            className="mx-auto mb-4"
          />
          <CardTitle className="text-2xl">GCS Cursos</CardTitle>
          <CardDescription>Acesse sua conta para continuar</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className='flex-col gap-4'>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
             <Button variant="link" size="sm" className="w-full text-muted-foreground">
              Esqueceu sua senha?
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
