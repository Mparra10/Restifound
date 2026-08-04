import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Separator } from './components/ui/separator';
import { Label } from './components/ui/label';
import { Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AppDashboard from './AppDashboard';

export default function AppWithAuth() {
  const { user, loading: authLoading, signIn, signUp, signInWithGoogle, signOut } = useAuth();
  const { profile, pet, tasks, events, customMoods, loading: dataLoading, saveProfile, savePet, addTask, updateTask, deleteTask, addEvent, deleteEvent, addMood, addCustomMood, saveHealth } = useUserData(user);

  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show onboarding if user is logged in but has no profile
  const needsOnboarding = user && !profile;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error('Error al iniciar sesión: ' + error.message);
    } else {
      toast.success('¡Bienvenido de vuelta!');
      setEmail('');
      setPassword('');
    }

    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signUp(email, password, name);

    if (error) {
      toast.error('Error al registrarse: ' + error.message);
    } else {
      toast.success('¡Cuenta creada! Por favor verifica tu email.');
      setEmail('');
      setPassword('');
      setName('');
    }

    setIsSubmitting(false);
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    const { error } = await signInWithGoogle();

    if (error) {
      toast.error('Error con Google: ' + error.message);
    }

    setIsSubmitting(false);
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      toast.success('Sesión cerrada');
    }
  };

  // Loading state
  if (authLoading || (user && dataLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#bcd7e3]/30 via-white to-[#bcd7e3]/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#152540] mx-auto mb-4" />
          <p className="text-[#152540]">Cargando...</p>
        </div>
      </div>
    );
  }

  // Logged in - show dashboard
  if (user && profile && pet) {
    return (
      <AppDashboard
        user={user}
        profile={profile}
        pet={pet}
        tasks={tasks}
        events={events}
        customMoods={customMoods}
        onLogout={handleLogout}
        onSaveProfile={saveProfile}
        onSavePet={savePet}
        onAddTask={addTask}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        onAddEvent={addEvent}
        onDeleteEvent={deleteEvent}
        onAddMood={addMood}
        onAddCustomMood={addCustomMood}
        onSaveHealth={saveHealth}
      />
    );
  }

  // Needs onboarding
  if (needsOnboarding) {
    return (
      <OnboardingFlow
        user={user}
        onComplete={async (data) => {
          await saveProfile({
            name: data.name,
            email: user.email!,
            age: data.age,
            sport: data.sport,
          });
          await savePet({
            pet_type: data.petType,
            pet_name: data.petName,
            level: 1,
            exp: 0,
            happiness: 75,
          });
          toast.success('¡Perfil completado!');
        }}
      />
    );
  }

  // Login/Signup screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#bcd7e3] via-white to-[#bcd7e3]/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-[#bcd7e3]">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-[#152540] rounded-full flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-[#152540] to-[#152540]/80 bg-clip-text text-transparent">
            Restifound
          </CardTitle>
          <CardDescription className="text-base text-[#152540]/70">
            Tu compañero de bienestar académico y deportivo
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={showSignup ? 'signup' : 'login'} onValueChange={(v) => setShowSignup(v === 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="estudiante@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="border-[#bcd7e3] focus:border-[#152540]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="border-[#bcd7e3] focus:border-[#152540]"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#152540] hover:bg-[#152540]/90 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
                </Button>

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-[#152540]/60">
                    o continuar con
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-[#bcd7e3] hover:bg-[#bcd7e3]/20"
                  onClick={handleGoogleAuth}
                  disabled={isSubmitting}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="border-[#bcd7e3] focus:border-[#152540]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="estudiante@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="border-[#bcd7e3] focus:border-[#152540]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="border-[#bcd7e3] focus:border-[#152540]"
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#152540] hover:bg-[#152540]/90 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Cuenta'}
                </Button>

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-[#152540]/60">
                    o continuar con
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-[#bcd7e3] hover:bg-[#bcd7e3]/20"
                  onClick={handleGoogleAuth}
                  disabled={isSubmitting}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Onboarding Component (simplified - you can expand this)
function OnboardingFlow({ user, onComplete }: { user: any; onComplete: (data: any) => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: user?.user_metadata?.name || '',
    age: 0,
    sport: '',
    petType: 'gato',
    petName: '',
  });

  const handleComplete = () => {
    onComplete(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#bcd7e3]/30 via-white to-[#bcd7e3]/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-[#bcd7e3] shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-[#152540]">Completa tu perfil</CardTitle>
          <CardDescription className="text-[#152540]/70">
            Paso {step} de 4
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add onboarding steps here - simplified for now */}
          <div className="space-y-4">
            <Input
              placeholder="Nombre"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Edad"
              value={data.age || ''}
              onChange={(e) => setData({ ...data, age: parseInt(e.target.value) })}
            />
            <Input
              placeholder="Deporte"
              value={data.sport}
              onChange={(e) => setData({ ...data, sport: e.target.value })}
            />
            <Input
              placeholder="Nombre de mascota"
              value={data.petName}
              onChange={(e) => setData({ ...data, petName: e.target.value })}
            />
            <Button
              onClick={handleComplete}
              className="w-full bg-[#152540]"
              disabled={!data.name || !data.age || !data.sport || !data.petName}
            >
              Completar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder for AppDashboard - this will be your existing App component
function AppDashboard({ user, profile, pet, tasks, events, customMoods, onLogout, onSaveProfile, onSavePet, onAddTask, onUpdateTask, onDeleteTask, onAddEvent, onDeleteEvent, onAddMood, onAddCustomMood, onSaveHealth }: any) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#bcd7e3]/30 via-white to-[#bcd7e3]/20 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Bienvenido, {profile.name}!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Email: {profile.email}</p>
              <p>Edad: {profile.age}</p>
              <p>Deporte: {profile.sport}</p>
              <p>Mascota: {pet.pet_name} ({pet.pet_type}) - Nivel {pet.level}</p>
              <Button onClick={onLogout}>Cerrar Sesión</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
