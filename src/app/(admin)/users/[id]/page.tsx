import UserDetailClient from './UserDetailClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

// H5 CA.1: Generamos al menos un parámetro estático para que el build pase en modo 'export'
export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page() {
  return <UserDetailClient />;
}
