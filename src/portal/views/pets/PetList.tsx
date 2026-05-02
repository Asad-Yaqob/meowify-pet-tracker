import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Edit, Phone, Plus, QrCode, Trash2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { useDeletePet, usePets } from 'src/lib/hooks/usePets';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'src/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'src/components/ui/dialog';

const appBaseUrl = import.meta.env.VITE_APP_BASE_URL || window.location.origin;

const PetList = () => {
  const navigate = useNavigate();
  const { data: pets, isLoading, isError } = usePets();
  const deleteMutation = useDeletePet();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [qrPet, setQrPet] = useState<{ id: string; name: string } | null>(null);

  const selectedDeletePet = useMemo(
    () => pets?.find((pet) => pet.id === deleteId) || null,
    [deleteId, pets],
  );

  const downloadQr = () => {
    if (!qrPet) return;
    const canvas = document.getElementById(`pet-qr-${qrPet.id}`) as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${qrPet.name.toLowerCase().replace(/\s+/g, '-')}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('Pet deleted');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  if (isError) {
    return <p className="text-red-500">Failed to load pets.</p>;
  }

  return (
    <>
      <BreadcrumbComp
        title="Pet List"
        items={[
          { title: 'Pets', to: '/portal/pets' },
          { title: 'List', to: '/portal/pets' },
        ]}
      />

      <div className="bg-white dark:bg-dark-card rounded-2xl border border-border dark:border-dark-border p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Manage all Meowify pet profiles and QR tags.</p>
          <Link
            to="/portal/pets/create"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" /> Create Pet
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-white dark:bg-dark-card"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pets?.map((pet) => (
            <div
              key={pet.id}
              className="rounded-2xl border border-border dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <img src={pet.imageUrl} alt={pet.name} className="h-16 w-16 rounded-xl object-cover" />
                  <div>
                    <h3 className="font-semibold text-lg">{pet.tagDisplayName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {pet.breed} - {pet.color}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {pet.contactNumber}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/portal/pets/edit/${pet.id}`)}
                    className="p-2 rounded-lg border border-border dark:border-dark-border hover:bg-lightgray"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(pet.id)}
                    className="p-2 rounded-lg border border-border dark:border-dark-border hover:bg-red-50 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setQrPet({ id: pet.id, name: pet.tagDisplayName })}
                    className="p-2 rounded-lg border border-border dark:border-dark-border hover:bg-lightgray"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedDeletePet?.tagDisplayName || 'pet'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently remove this profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!qrPet} onOpenChange={(open) => !open && setQrPet(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code {qrPet ? `for ${qrPet.name}` : ''}</DialogTitle>
          </DialogHeader>
          {qrPet ? (
            <div className="space-y-4">
              <div className="flex justify-center p-2 bg-white rounded-xl">
                <QRCodeCanvas id={`pet-qr-${qrPet.id}`} value={`${appBaseUrl}/pet/${qrPet.id}`} size={220} includeMargin />
              </div>
              <p className="text-xs text-muted-foreground break-all">{`${appBaseUrl}/pet/${qrPet.id}`}</p>
              <button
                onClick={downloadQr}
                className="w-full py-2 rounded-xl bg-primary text-white hover:bg-primary-hover"
              >
                Download QR
              </button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PetList;
