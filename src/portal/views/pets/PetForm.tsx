import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from 'src/context/auth/AuthContext';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { useCreatePet, usePet, useUpdatePet } from 'src/lib/hooks/usePets';
import { uploadPetImage } from 'src/lib/services/api/cloudinaryService';
import { PetPayload } from 'src/lib/types/petTypes';
import { Label } from 'src/components/ui/label';

/** Reusable inline spinner to replace duplicated inline SVGs */
const SpinnerIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const emptyForm: PetPayload = {
  name: '',
  gender: '',
  breed: '',
  color: '',
  age: '',
  identification: '',
  tagDisplayName: '',
  ownerName: '',
  ownerAddress: '',
  contactNumber: '',
  imageUrl: '',
};

const PetForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isEdit = !!id;
  const { data: pet, isLoading: isLoadingPet } = usePet(id || '');
  const createMutation = useCreatePet();
  const updateMutation = useUpdatePet(id || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<PetPayload>(emptyForm);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (pet) {
      const {
        id: _id,
        createdBy: _createdBy,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...editable
      } = pet;
      setForm(editable);
    }
  }, [pet]);

  const isSaving = useMemo(
    () => createMutation.isPending || updateMutation.isPending || uploadingImage,
    [createMutation.isPending, updateMutation.isPending, uploadingImage],
  );

  const setValue = (field: keyof PetPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await uploadPetImage(file);
      setValue('imageUrl', imageUrl);
      toast.success('Image uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      // Reset the input so the same file can be re-selected if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (event: React.MouseEvent) => {
    // Prevent the click from bubbling up to the upload area
    event.stopPropagation();
    setValue('imageUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Image removed');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      toast.error('Session expired. Please login again.');
      navigate('/portal/login');
      return;
    }

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync(form);
        toast.success('Cat profile updated');
      } else {
        await createMutation.mutateAsync({ payload: form, createdBy: user.id });
        toast.success('Cat profile created');
      }
      navigate('/portal/pets');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save pet profile');
    }
  };

  if (isEdit && isLoadingPet) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const breadcrumbs = [
    { title: 'Pets', to: '/portal/pets' },
    { title: isEdit ? 'Edit Pet' : 'Create Pet', to: '#' },
  ];

  return (
    <>
      <BreadcrumbComp title={isEdit ? 'Edit Pet' : 'Create Pet'} items={breadcrumbs} />

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6 pb-20">
        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-border dark:border-dark-border shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Pet Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(
              [
                ['name', 'Name'],
                ['gender', 'Gender'],
                ['breed', 'Breed'],
                ['color', 'Color'],
                ['age', 'Age'],
                ['identification', 'Identification'],
                ['tagDisplayName', 'Tag Display Name'],
                ['ownerName', 'Owner Name'],
                ['ownerAddress', 'Owner Address'],
                ['contactNumber', 'Contact Number'],
              ] as Array<[keyof PetPayload, string]>
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <input
                  id={key}
                  value={form[key]}
                  onChange={(e) => setValue(key, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border dark:border-dark-border bg-transparent focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-border dark:border-dark-border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Image Upload</h2>
          <div className="relative">
            <div
              onClick={() => !uploadingImage && fileInputRef.current?.click()}
              className={`h-64 border-2 border-dashed rounded-2xl flex items-center justify-center overflow-hidden border-border dark:border-dark-border transition-colors ${
                uploadingImage
                  ? 'cursor-not-allowed opacity-70'
                  : 'cursor-pointer hover:border-primary'
              }`}
            >
              {form.imageUrl ? (
                <img src={form.imageUrl} alt={form.name || 'Pet image'} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  {uploadingImage ? (
                    <>
                      <SpinnerIcon className="mx-auto mb-2 h-8 w-8 text-primary" />
                      <p className="font-semibold text-sm text-muted-foreground">Uploading…</p>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-2 h-8 w-8 text-primary" />
                      <p className="font-semibold">Click to upload pet image</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 10 MB</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Remove button — only shown when an image is present and not currently uploading */}
            {form.imageUrl && !uploadingImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                aria-label="Remove image"
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/90 hover:bg-red-600 text-white text-xs font-medium shadow-md transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-border dark:border-dark-border shadow-sm">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/portal/pets')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border dark:border-dark-border hover:bg-lightgray dark:hover:bg-dark"
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-50 transition-all"
            >
              {isSaving ? (
                <>
                  <SpinnerIcon className="h-4 w-4" />
                  {isEdit ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> {isEdit ? 'Save Changes' : 'Create Pet'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default PetForm;
