import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import {
    Card,
    Text,
    RadioButton,
    TouchableRipple,
    Portal,
    Modal,
    Button,
    IconButton
} from 'react-native-paper';
import { SupportedLanguage, LanguageOption } from '@/services';
import {useLocalization} from "@/hooks";

interface LanguageSelectorProps {
    styles: any;
    customColors: any;
}

export default function LanguageSelector({ styles, customColors }: LanguageSelectorProps) {
    const {
        t,
        currentLanguage,
        availableLanguages,
        setLanguage
    } = useLocalization();

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(currentLanguage);

    const handleLanguageSelect = (languageCode: SupportedLanguage) => {
        setSelectedLanguage(languageCode);
    };

    const handleSave = async () => {
        if (selectedLanguage !== currentLanguage) {
            await setLanguage(selectedLanguage);
        }
        setModalVisible(false);
    };

    const handleCancel = () => {
        setSelectedLanguage(currentLanguage); // Reset to current language
        setModalVisible(false);
    };

    const renderLanguageItem = ({ item }: { item: LanguageOption }) => (
        <TouchableRipple
            onPress={() => handleLanguageSelect(item.code)}
            rippleColor={customColors.primary + '20'}
        >
            <View style={[styles.listItem, {
                backgroundColor: selectedLanguage === item.code ? customColors.primary + '10' : 'transparent',
                borderColor: selectedLanguage === item.code ? customColors.primary : 'transparent',
                borderWidth: selectedLanguage === item.code ? 1 : 0,
            }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={[styles.flagText, { fontSize: 24, marginRight: 12 }]}>
                        {item.flag}
                    </Text>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.listItemTitle, { color: customColors.text }]}>
                            {item.nativeName}
                        </Text>
                        <Text style={[styles.listItemSubtitle, { color: customColors.textSecondary }]}>
                            {item.name}
                        </Text>
                    </View>
                </View>
                <RadioButton
                    value={item.code}
                    status={selectedLanguage === item.code ? 'checked' : 'unchecked'}
                    onPress={() => handleLanguageSelect(item.code)}
                    color={customColors.primary}
                />
            </View>
        </TouchableRipple>
    );

    const currentLanguageInfo = availableLanguages.find(lang => lang.code === currentLanguage);

    return (
        <>
            <Card style={[styles.card, { backgroundColor: customColors.surface }]}>
                <Card.Content>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, { color: customColors.text }]}>
                                {t('settings.language')}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <Text style={[styles.flagText, { fontSize: 20, marginRight: 8 }]}>
                                    {currentLanguageInfo?.flag}
                                </Text>
                                <Text style={[styles.cardSubtitle, { color: customColors.textSecondary }]}>
                                    {currentLanguageInfo?.nativeName} ({currentLanguageInfo?.name})
                                </Text>
                            </View>
                        </View>
                        <IconButton
                            icon="chevron-right"
                            size={24}
                            iconColor={customColors.textSecondary}
                            onPress={() => setModalVisible(true)}
                        />
                    </View>
                </Card.Content>
            </Card>

            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={handleCancel}
                    contentContainerStyle={[
                        styles.modalContainer,
                        {
                            backgroundColor: customColors.surface,
                            margin: 20,
                            borderRadius: 12,
                            maxHeight: '80%'
                        }
                    ]}
                >
                    <View style={{ padding: 20 }}>
                        <Text style={[
                            styles.modalTitle,
                            { color: customColors.text, fontSize: 20, fontWeight: '600', marginBottom: 20 }
                        ]}>
                            {t('settings.selectLanguage')}
                        </Text>

                        <FlatList
                            data={availableLanguages}
                            renderItem={renderLanguageItem}
                            keyExtractor={(item) => item.code}
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: 400 }}
                        />

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginTop: 20,
                            gap: 12
                        }}>
                            <Button
                                mode="outlined"
                                onPress={handleCancel}
                                style={{
                                    flex: 1,
                                    borderColor: customColors.primary
                                }}
                                labelStyle={{ color: customColors.primary }}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleSave}
                                style={{
                                    flex: 1,
                                    backgroundColor: customColors.primary
                                }}
                                labelStyle={{ color: '#fff' }}
                            >
                                {t('common.save')}
                            </Button>
                        </View>
                    </View>
                </Modal>
            </Portal>
        </>
    );
}
