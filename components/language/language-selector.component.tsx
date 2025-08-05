// LanguageSelector.tsx (Fixed with rounded cards)
import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Text } from 'react-native';
import { SupportedLanguage, LanguageOption } from '@/services';
import { useLocalization } from "@/hooks";

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

    const handleCardPress = () => {
        setModalVisible(true);
    };

    const renderLanguageItem = ({ item }: { item: LanguageOption }) => (
        <TouchableOpacity
            style={[
                styles.listItem,
                {
                    backgroundColor: selectedLanguage === item.code ? customColors.instagramBlue + '20' : 'transparent',
                    borderColor: selectedLanguage === item.code ? customColors.instagramBlue : customColors.borderColor,
                    borderWidth: 1,
                    marginVertical: 4,
                    borderRadius: 8,
                }
            ]}
            onPress={() => handleLanguageSelect(item.code)}
        >
            <View style={[
                styles.itemIcon,
                { backgroundColor: 'transparent' }
            ]}>
                <Text style={{ fontSize: 24 }}>
                    {item.flag}
                </Text>
            </View>

            <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: customColors.text }]}>
                    {item.nativeName}
                </Text>
                <Text style={[styles.itemSubtitle, { color: customColors.subtleGray }]}>
                    {item.name}
                </Text>
            </View>

            <View style={[
                styles.checkbox,
                selectedLanguage === item.code && styles.checkboxChecked
            ]}>
                {selectedLanguage === item.code && (
                    <Text style={styles.checkboxIcon}>✓</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    const currentLanguageInfo = availableLanguages.find(lang => lang.code === currentLanguage);

    return (
        <>
            <View style={styles.card}>
                {/* Section header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
                    <Text style={styles.sectionSubtitle}>{t('settings.languageSubtitle')}</Text>
                </View>

                {/* Language selection - clickable entire card content */}
                <TouchableOpacity
                    style={[styles.listItem, styles.listItemLast]}
                    onPress={handleCardPress}
                >
                    <View style={[
                        styles.itemIcon,
                        { backgroundColor: '#e3f2fd' }
                    ]}>
                        <Text style={{ fontSize: 18 }}>
                            {currentLanguageInfo?.flag || '🌍'}
                        </Text>
                    </View>

                    <View style={styles.itemContent}>
                        <Text style={styles.itemTitle}>{t('settings.currentLanguage')}</Text>
                        <Text style={styles.itemSubtitle}>
                            {currentLanguageInfo?.nativeName} ({currentLanguageInfo?.name})
                        </Text>
                    </View>

                    <View style={styles.itemAction}>
                        <Text style={[styles.actionText, { color: customColors.instagramBlue }]}>
                            {t('settings.change')}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Modal for language selection */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleCancel}
            >
                <View style={[
                    styles.modalContainer,
                    {
                        backgroundColor: customColors.background,
                        flex: 1,
                        paddingTop: 60,
                    }
                ]}>
                    {/* Modal Header */}
                    <View style={[
                        styles.modalHeader,
                        {
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            paddingBottom: 20,
                            borderBottomWidth: 0.5,
                            borderBottomColor: customColors.borderColor,
                        }
                    ]}>
                        <TouchableOpacity onPress={handleCancel}>
                            <Text style={[styles.modalButton, { color: customColors.subtleGray }]}>
                                {t('common.cancel')}
                            </Text>
                        </TouchableOpacity>

                        <Text style={[
                            styles.modalTitle,
                            {
                                color: customColors.text,
                                fontSize: 18,
                                fontWeight: '600'
                            }
                        ]}>
                            {t('settings.selectLanguage')}
                        </Text>

                        <TouchableOpacity onPress={handleSave}>
                            <Text style={[
                                styles.modalButton,
                                {
                                    color: customColors.instagramBlue,
                                    fontWeight: '600'
                                }
                            ]}>
                                {t('common.save')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Language List */}
                    <View style={styles.card}>
                        <FlatList
                            data={availableLanguages}
                            renderItem={renderLanguageItem}
                            keyExtractor={(item) => item.code}
                            showsVerticalScrollIndicator={false}
                            style={{ padding: 16 }}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
}
