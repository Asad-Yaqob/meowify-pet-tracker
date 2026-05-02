import { MapPin, Phone, PhoneCall, User, Tag, Palette, Cat, Fingerprint, Shield, Heart } from 'lucide-react';
import { useParams } from 'react-router';
import { usePet } from 'src/lib/hooks/usePets';
import Spinner from '../spinner/Spinner';

const Badge = ({ children, color = 'primary' }: { children: React.ReactNode; color?: string }) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide
      ${color === 'primary' ? 'bg-primary/10 text-primary' : ''}
      ${color === 'green'   ? 'bg-green-100 text-green-700' : ''}
      ${color === 'blue'    ? 'bg-blue-100 text-blue-700'   : ''}
      ${color === 'pink'    ? 'bg-pink-100 text-pink-600'   : ''}
    `}
  >
    {children}
  </span>
);

const DetailItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="flex gap-4 items-start">
    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
      <Icon className="h-4 w-4 text-gray-500" />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-gray-800 font-semibold mt-0.5">{value}</p>
    </div>
  </div>
);

const MeowifyLogo = ({ light = false }: { light?: boolean }) => (
  <div className="flex items-center gap-2">
    <img src="/logo.png" alt="Meowify" className="h-auto w-16 object-contain" />
    {!light && (
      <span className="text-xl font-bold tracking-tight text-white sr-only">Meowify</span>
    )}
  </div>
);

const PublicPetPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { data: pet, isLoading } = usePet(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6">
          <MeowifyLogo />
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="text-7xl mb-6">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Profile Not Found</h1>
            <p className="text-gray-500">This QR code doesn't match an active Meowify pet profile.</p>
          </div>
        </div>
      </div>
    );
  }

  const genderEmoji = pet.gender?.toLowerCase() === 'female' ? '♀️' : '♂️';
  const genderColor = pet.gender?.toLowerCase() === 'female' ? 'pink' : 'blue';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── Sticky Top Nav ─────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-primary px-6 py-3 flex items-center justify-between shadow-md shadow-primary/30">
        <MeowifyLogo light />
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-white/20 text-white border border-white/30">
          QR Pet Tag
        </span>
      </header>

      {/* ── Main Content ───────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">

          {/* LEFT — Image Gallery */}
          <div className="lg:sticky lg:top-24 space-y-4">
            {/* Main Image */}
            <div className="relative rounded-3xl overflow-hidden bg-gray-100 aspect-square shadow-xl">
              <img
                src={pet.imageUrl}
                alt={pet.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/600x600/f8e4d0/c9684a?text=🐱';
                }}
              />
              {/* Bottom-left tag badge */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg border border-white">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Tag Name</p>
                <p className="text-gray-800 font-bold text-lg leading-tight">{pet.tagDisplayName}</p>
              </div>
            </div>

            {/* Contact CTA — visible on desktop left column */}
            <div className="hidden lg:flex flex-col gap-3">
              <a
                href={`tel:${pet.contactNumber}`}
                className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary text-white font-bold text-base shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                <PhoneCall className="h-5 w-5" />
                Call Owner — {pet.contactNumber}
              </a>
              <a
                href={`https://wa.me/${pet.contactNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-green-500 text-green-600 font-bold hover:bg-green-50 active:scale-[0.98] transition-all"
              >
                <svg className="h-5 w-5 fill-green-500" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Owner
              </a>
            </div>
          </div>

          {/* RIGHT — Details */}
          <div className="space-y-8">

            {/* Name & Badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge color={genderColor}>{pet.gender} {genderEmoji}</Badge>
                <Badge color="primary">{pet.breed}</Badge>
                <Badge color="green">{pet.age} old</Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
                {pet.name}
              </h1>
              <p className="text-gray-400 mt-2 text-sm flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                ID: <span className="font-mono font-semibold text-gray-600">{pet.identification}</span>
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Physical Details */}
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
                Pet Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DetailItem icon={Cat}         label="Breed"          value={pet.breed} />
                <DetailItem icon={Palette}     label="Color / Coat"   value={pet.color} />
                <DetailItem icon={Tag}         label="Gender"         value={`${pet.gender} ${genderEmoji}`} />
                <DetailItem icon={Heart}       label="Age"            value={pet.age} />
                <DetailItem icon={Fingerprint} label="ID / Chip No."  value={pet.identification} />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Owner Details */}
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
                Owner Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DetailItem icon={User}   label="Owner Name"    value={pet.ownerName} />
                <DetailItem icon={Phone}  label="Contact"       value={pet.contactNumber} />
                <div className="sm:col-span-2">
                  <DetailItem icon={MapPin} label="Address" value={pet.ownerAddress} />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Mobile CTA — only on small screens */}
            <div className="flex flex-col gap-3 lg:hidden">
              <a
                href={`tel:${pet.contactNumber}`}
                className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary text-white font-bold text-base shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                <PhoneCall className="h-5 w-5" />
                Call Owner — {pet.contactNumber}
              </a>
              <a
                href={`https://wa.me/${pet.contactNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-green-500 text-green-600 font-bold hover:bg-green-50 active:scale-[0.98] transition-all"
              >
                <svg className="h-5 w-5 fill-green-500" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Owner
              </a>
            </div>

            {/* Trust Badge */}
            <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Verified Meowify QR Pet Profile · ID <span className="font-mono">{id.slice(0, 8)}…</span></span>
            </div>

          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="bg-primary mt-8 py-6 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MeowifyLogo light />
        </div>
        <p className="text-xs text-white ">QR-based Pet Identification System</p>
      </footer>

    </div>
  );
};

export default PublicPetPage;
