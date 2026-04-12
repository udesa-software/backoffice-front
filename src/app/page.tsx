import { LoginForm } from '@/features/auth/components/LoginForm';

export default function Home() {
  return (
    <main className="page-container">
      <div className="page-content">
        <LoginForm />
      </div>
    </main>
  );
}
