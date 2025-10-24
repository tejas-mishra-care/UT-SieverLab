
import React from 'react';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Image src="/UT.jpeg?v=2" alt="UT Logo" width={100} height={100} className={className} />
  );
}
