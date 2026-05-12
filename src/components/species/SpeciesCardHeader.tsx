import { FishSvg } from './FishSvg';
import styles from './SpeciesCardHeader.module.css';

const SALT_SPECIES = new Set([
  'Torsk', 'Kveite', 'Sei', 'Hyse', 'Lange', 'Brosme',
  'Uer', 'Steinbit', 'Makrell', 'Rødspette', 'Lomre',
  'Sandflyndre', 'Sild', 'Laks', 'Sjøørret', 'Sjørøye',
]);

interface Props {
  name: string;
  action?: React.ReactNode;
}

export function SpeciesCardHeader({ name, action }: Props) {
  const water = SALT_SPECIES.has(name) ? 'Saltvann' : 'Ferskvann';
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
