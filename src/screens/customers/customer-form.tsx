import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { TERMS } from '@/data/customers/mock';
import type { CustomerDraft, CustomerType } from '@/data/customers/types';

export interface CustomerFormProps {
  draft: CustomerDraft;
  touched: boolean;
  nameOk: boolean;
  isEditing: boolean;
  onChange: (patch: Partial<CustomerDraft>) => void;
  onDelete: () => void;
}

const FIELDS: { key: keyof CustomerDraft; label: string; placeholderCompany: string; placeholderPerson?: string }[] = [
  { key: 'name', label: 'name', placeholderCompany: 'Northfield Apparel', placeholderPerson: 'Anita Shrestha' },
  { key: 'contact', label: 'Contact person', placeholderCompany: 'Ellie Marsh' },
  { key: 'role', label: 'Role', placeholderCompany: 'Buying manager' },
  { key: 'email', label: 'Email', placeholderCompany: 'name@company.com' },
  { key: 'phone', label: 'Phone', placeholderCompany: '+44 20 7946 0912' },
  { key: 'city', label: 'City', placeholderCompany: 'London' },
  { key: 'address', label: 'Address', placeholderCompany: 'Street, city, postcode' },
];

export function CustomerForm({ draft, touched, nameOk, isEditing, onChange, onDelete }: CustomerFormProps) {
  const theme = useTheme();
  const terms = TERMS.concat(draft.terms === 'Cash' ? ['Cash'] : []);

  return (
    <View style={styles.wrap}>
      <View style={[styles.typeTabs, { backgroundColor: theme.draftWash }]}>
        {(['company', 'person'] as CustomerType[]).map((t) => {
          const on = draft.type === t;
          return (
            <Pressable
              key={t}
              onPress={() => onChange({ type: t })}
              style={[styles.typeTab, { backgroundColor: on ? theme.surface : 'transparent', boxShadow: on ? theme.shadows.card : undefined }]}
            >
              <Text style={[styles.typeTabLabel, { color: on ? theme.textPrimary : theme.textSecondary }]}>{t === 'company' ? 'Company' : 'Individual'}</Text>
            </Pressable>
          );
        })}
      </View>

      <Card elevation="raised" style={styles.fieldsCard}>
        {FIELDS.map((f) => {
          const bad = f.key === 'name' && touched && !nameOk;
          const label = f.key === 'name' ? (draft.type === 'company' ? 'Company name' : 'Full name') : f.label;
          const placeholder = f.key === 'name' && draft.type === 'person' ? (f.placeholderPerson ?? f.placeholderCompany) : f.placeholderCompany;
          return (
            <TextField
              key={f.key}
              label={label}
              labelRight={bad ? <Text style={[styles.requiredNote, { color: theme.dangerWashText }]}>required</Text> : undefined}
              value={draft[f.key]}
              onChangeText={(v) => onChange({ [f.key]: v } as Partial<CustomerDraft>)}
              placeholder={placeholder}
              compact
            />
          );
        })}

        <View style={styles.group}>
          <Text style={[styles.termsLabel, { color: theme.textSecondary }]}>Payment terms</Text>
          <View style={styles.termsRow}>
            {terms.map((t) => {
              const on = draft.terms === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => onChange({ terms: t })}
                  style={[styles.termChip, { backgroundColor: on ? theme.surfaceInverted : theme.surface, borderColor: on ? theme.surfaceInverted : theme.border }]}
                >
                  <Text style={[styles.termChipLabel, { color: on ? theme.onDark.text : theme.textPrimary }]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      {isEditing ? (
        <Pressable onPress={onDelete} style={styles.deleteLink}>
          <Text style={[styles.deleteLinkLabel, { color: theme.dangerWashText }]}>Delete this customer</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  typeTabs: { flexDirection: 'row', padding: 4, borderRadius: 14, gap: 6 },
  typeTab: { flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  typeTabLabel: { fontFamily: fontFamily.semibold, fontSize: 13.5 },
  fieldsCard: { padding: 16, gap: 14 },
  requiredNote: { fontFamily: fontFamily.mono, fontSize: 9.5 },
  group: { gap: 8 },
  termsLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.11 * 9.5, textTransform: 'uppercase' },
  termsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  termChip: { height: 36, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  termChipLabel: { fontFamily: fontFamily.semibold, fontSize: 12.5 },
  deleteLink: { height: 46, alignItems: 'center', justifyContent: 'center' },
  deleteLinkLabel: { fontSize: 14.5, fontWeight: '600' },
});
