import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Spinner } from '../components/common';

/**
 * Register Page
 */

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="py-12 text-center">
      <Spinner />
    </div>
  );
}
