import { login, registerAccount } from "@/api/auth";
import { useAuth } from "@/app/auth/auth-context";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { CheckCircle2, ClipboardCheck, Clock3, Eye, EyeOff, LoaderCircle, LockKeyhole, LogIn, ScanBarcode, ShieldCheck, UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import * as z from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Podaj poprawny adres e-mail"),
  password: z.string().min(1, "Podaj hasło"),
  rememberMe: z.boolean(),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Imię i nazwisko musi mieć co najmniej 2 znaki"),
  email: z.string().trim().email("Podaj poprawny adres e-mail"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
  confirmPassword: z.string().min(1, "Powtórz hasło"),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Hasła nie są takie same",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registeredEmail, setRegisteredEmail] = useState("");

  return (
    <main className="app-auth min-h-screen bg-[#f5f6f2] lg:grid lg:grid-cols-[minmax(360px,0.85fr)_minmax(540px,1.15fr)]">
      <section className="relative hidden overflow-hidden bg-[#173b2d] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-[#ffdc24]/10" />
        <div className="absolute -bottom-70 -left-28 size-[30rem] rounded-full border-[80px] border-white/[0.035]" />
        <img src="/dino-logo.svg" alt="DINO" className="relative w-32 rounded-xl bg-white px-3 py-2" />
        <div className="relative max-w-lg">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffdc24]">Inwentaryzacja sklepu</p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.04em] xl:text-5xl">Inwentaryzacja bez kartek i przepisywania.</h1>
          <p className="mt-5 text-lg leading-8 text-white/65">Jedno bezpieczne konto pracownika przechowuje katalog, inwentaryzacje, paragony i raporty sklepu.</p>
          <div className="mt-9 space-y-3">
            <Feature icon={ScanBarcode} label="Skanowanie kodów na tablecie" />
            <Feature icon={ClipboardCheck} label="Stan spisany i skorygowany o sprzedaż" />
            <Feature icon={ShieldCheck} label="Dostęp dopiero po akceptacji administratora" />
          </div>
        </div>
        <p className="relative text-xs text-white/40">Panel wewnętrzny · dostęp dla upoważnionych pracowników</p>
      </section>

      <section className="app-auth-main grid min-h-screen place-items-center px-4 py-7 sm:px-8 lg:px-12">
        <div className="app-auth-wrap w-full max-w-[520px]">
          <div className="app-auth-mobile-brand mb-7 flex items-center justify-between lg:hidden">
            <img src="/dino-logo.svg" alt="DINO" className="w-24" />
            <span className="rounded-md bg-[#e8f3ed] px-3 py-1.5 text-xs font-bold text-primary">Panel sklepu</span>
          </div>

          <div className="app-auth-card overflow-hidden rounded-xl border bg-white shadow-[0_18px_55px_rgba(24,51,41,0.09)]">
            {registeredEmail ? (
              <RegistrationPending email={registeredEmail} onReturn={() => { setRegisteredEmail(""); setMode("login"); }} />
            ) : (
              <>
                <div className="grid grid-cols-2 border-b bg-[#f7f8f5] p-1.5">
                  <button type="button" onClick={() => setMode("login")} className={`min-h-12 rounded-xl px-3 text-sm font-bold transition-colors ${mode === "login" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}>Logowanie</button>
                  <button type="button" onClick={() => setMode("register")} className={`min-h-12 rounded-xl px-3 text-sm font-bold transition-colors ${mode === "register" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}>Rejestracja</button>
                </div>
                <div className="app-auth-content p-5 sm:p-8">
                  {mode === "login" ? <LoginForm /> : <RegisterForm onRegistered={setRegisteredEmail} />}
                </div>
              </>
            )}
          </div>
          <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">Nie udostępniaj hasła innym pracownikom. Każde konto posiada oddzielne dane inwentaryzacji.</p>
        </div>
      </section>
    </main>
  );
}

function LoginForm() {
  const { completeLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { control, register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const submit = async (values: LoginValues) => {
    try {
      const response = await login(values);
      completeLogin(response.access_token, response.user, values.rememberMe);
      const requestedPath = (location.state as { from?: string } | null)?.from;
      const destination = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/";
      navigate(destination, { replace: true });
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      const message = status === 403
        ? "Konto jest jeszcze nieaktywne. Administrator musi zatwierdzić je w bazie danych."
        : status === 401
          ? "Nieprawidłowy e-mail lub hasło."
          : "Nie udało się połączyć z serwerem. Spróbuj ponownie.";
      setError("root", { message });
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="app-auth-form space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">Dostęp pracownika</p>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.035em]">Zaloguj się</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Wróć do swoich inwentaryzacji i kontynuuj pracę.</p>
      </div>

      <Field label="Adres e-mail" error={errors.email?.message}>
        <Input type="email" autoComplete="email" inputMode="email" placeholder="pracownik@sklep.pl" aria-invalid={Boolean(errors.email)} {...register("email")} />
      </Field>
      <Field label="Hasło" error={errors.password?.message}>
        <PasswordInput show={showPassword} onToggle={() => setShowPassword((value) => !value)} autoComplete="current-password" aria-invalid={Boolean(errors.password)} {...register("password")} />
      </Field>

      <Controller
        name="rememberMe"
        control={control}
        render={({ field }) => (
          <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border bg-[#f7f8f5] px-4">
            <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} className="size-5" />
            <span>
              <span className="block text-sm font-bold">Pamiętaj mnie na tym urządzeniu</span>
              <span className="block text-xs text-muted-foreground">Sesja pozostanie po zamknięciu przeglądarki.</span>
            </span>
          </label>
        )}
      />

      {errors.root?.message && <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold leading-6 ${errors.root.message.includes("nieaktywne") ? "border-amber-200 bg-amber-50 text-amber-950" : "border-red-200 bg-red-50 text-red-800"}`}>{errors.root.message}</div>}

      <Button type="submit" size="lg" className="h-14 w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="animate-spin" /> : <LogIn />}
        {isSubmitting ? "Logowanie…" : "Zaloguj się"}
      </Button>
    </form>
  );
}

function RegisterForm({ onRegistered }: { onRegistered: (email: string) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const submit = async (values: RegisterValues) => {
    try {
      await registerAccount({ name: values.name, email: values.email, password: values.password });
      onRegistered(values.email.trim().toLowerCase());
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      setError("root", {
        message: status === 409
          ? "Konto z tym adresem e-mail już istnieje."
          : "Nie udało się utworzyć konta. Sprawdź połączenie i spróbuj ponownie.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="app-auth-form space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">Nowy pracownik</p>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.035em]">Utwórz konto</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Po rejestracji konto będzie oczekiwać na aktywację przez administratora.</p>
      </div>

      <Field label="Imię i nazwisko" error={errors.name?.message}>
        <Input autoComplete="name" placeholder="np. Anna Kowalska" aria-invalid={Boolean(errors.name)} {...register("name")} />
      </Field>
      <Field label="Adres e-mail" error={errors.email?.message}>
        <Input type="email" autoComplete="email" inputMode="email" placeholder="pracownik@sklep.pl" aria-invalid={Boolean(errors.email)} {...register("email")} />
      </Field>
      <Field label="Hasło" error={errors.password?.message}>
        <PasswordInput show={showPassword} onToggle={() => setShowPassword((value) => !value)} autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register("password")} />
      </Field>
      <Field label="Powtórz hasło" error={errors.confirmPassword?.message}>
        <PasswordInput show={showPassword} onToggle={() => setShowPassword((value) => !value)} autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} {...register("confirmPassword")} />
      </Field>

      {errors.root?.message && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{errors.root.message}</div>}

      <Button type="submit" size="lg" className="h-14 w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="animate-spin" /> : <UserRoundPlus />}
        {isSubmitting ? "Tworzenie konta…" : "Zarejestruj konto"}
      </Button>
    </form>
  );
}

function RegistrationPending({ email, onReturn }: { email: string; onReturn: () => void }) {
  return (
    <div className="app-auth-content p-6 text-center sm:p-10">
      <div className="mx-auto grid size-16 place-items-center rounded-xl bg-amber-100 text-amber-800"><Clock3 className="size-8" /></div>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.15em] text-amber-700">Oczekuje na akceptację</p>
      <h2 className="mt-2 text-3xl font-black tracking-[-0.035em]">Konto zostało utworzone</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Adres <strong className="text-foreground">{email}</strong> został zapisany, ale logowanie będzie możliwe dopiero po aktywacji konta przez administratora.</p>
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-950">
        <p className="flex items-center gap-2 font-bold"><ShieldCheck className="size-5" /> Co dalej?</p>
        <p className="mt-2 leading-6">Skontaktuj się z administratorem sklepu. Nie musisz rejestrować konta ponownie.</p>
      </div>
      <Button type="button" size="lg" className="mt-7 w-full" onClick={onReturn}><LogIn /> Wróć do logowania</Button>
    </div>
  );
}

function Feature({ icon: Icon, label }: { icon: typeof CheckCircle2; label: string }) {
  return <div className="flex items-center gap-3 text-sm font-semibold text-white/80"><span className="grid size-9 place-items-center rounded-xl bg-white/10 text-[#ffdc24]"><Icon className="size-5" /></span>{label}</div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div><Label className="mb-2">{label}</Label>{children}{error && <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p>}</div>;
}

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  show: boolean;
  onToggle: () => void;
};

function PasswordInput({ show, onToggle, ...props }: PasswordInputProps) {
  return (
    <div className="relative">
      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input type={show ? "text" : "password"} className="pl-12 pr-14" {...props} />
      <button type="button" onClick={onToggle} className="absolute right-1.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-muted-foreground hover:bg-muted" aria-label={show ? "Ukryj hasło" : "Pokaż hasło"}>
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  );
}

export default AuthPage;
