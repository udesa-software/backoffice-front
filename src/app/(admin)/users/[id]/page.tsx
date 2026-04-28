import UserDetailClient from './UserDetailClient';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page() {
  return <UserDetailClient />;
}
