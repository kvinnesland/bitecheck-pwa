import { useTranslation } from 'react-i18next';
import { SPECIES_WATER } from '../../lib/speciesInfo';
import { FishSvg } from './FishSvg';

interface Props {
  name: string;
  action?: React.ReactNode;
}

export function SpeciesCardHeader({ name, action }: Props) {
  const { t } = useTranslation();
  const water = SPECIES_WATER.get(name) === 'salt'
    ? t('species.saltwater')
    : t('species.freshwater');
  const displayName = t(`speciesNames.${name}`, { defaultValue: name });
  return (
    <>
      <FishSvg name={name} className="w-full h-[100px] text-text-muted block" />
      <div className="flex items-center gap-2.5 mt-2">
        <h2 className="text-[1.4rem] font-bold text-text flex-1">{displayName}</h2>
        <span className="text-[0.7rem] font-bold uppercase px-2 py-0.5 rounded border border-accent text-accent shrink-0">
          {water}
        </span>
        {action}
      </div>
    </>
  );
}
