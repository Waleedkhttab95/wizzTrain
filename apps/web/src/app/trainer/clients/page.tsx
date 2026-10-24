import { redirect } from 'next/navigation';

/** `/trainer/clients` has no list of its own — the roster lives at `/trainer`. */
export default function ClientsIndex() {
  redirect('/trainer');
}
