import { Segmented, type SegmentedOption } from '@/components/ui/segmented';
import { useCurrency } from '@/lib/currency-context';
import { CURRENCY_SYMBOL, GBP_RATE, type Currency } from '@/lib/currency';

import { SettingRow } from './setting-row';

const OPTIONS: SegmentedOption<Currency>[] = [
  { value: 'NPR', label: 'NPR' },
  { value: 'GBP', label: 'GBP' },
];

/** The app-wide primary currency (plan item 1 / §2.3). Lived on the More hub until Settings existed. */
export function CurrencyCard() {
  const { primary, setPrimary } = useCurrency();

  return (
    <SettingRow
      label="Currency"
      meta={`Amounts show ${primary} first · 1 ${CURRENCY_SYMBOL.GBP} = ${GBP_RATE} ${CURRENCY_SYMBOL.NPR}`}
    >
      <Segmented options={OPTIONS} value={primary} onChange={setPrimary} fill />
    </SettingRow>
  );
}
