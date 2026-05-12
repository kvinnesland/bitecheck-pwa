import { SPECIES_WATER } from '../../lib/biteScore';
import { FishSvg } from './FishSvg';
import styles from './SpeciesCardHeader.module.css';

interface Props {
  name: string;
  action?: React.ReactNode;
}

export function SpeciesCardHeader({ name, action }: Props) {
  const water = SPECIES_WATER.get(name) === 'salt' ? 'Saltvann' : 'Ferskvann';
  return (
    <>
      <FishSvg name={name} className={styles.fishIllustration} />
      <div className={styles.nameRow}>
        <h2 className={styles.speciesName}>{name}</h2>
        <span className={styles.waterBadge}>{water}</span>
        {action}
      </div>
    </>
  );
}
