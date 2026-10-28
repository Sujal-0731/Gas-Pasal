import { useState, useEffect, useMemo } from 'react';
import { 
  IconDealer, 
  IconPlus, 
  IconRefresh,
  IconChevronLeft,
  IconCalendar,
  IconFilledCylinder,
  IconEmptyCylinder,
  IconLokpriya,
  IconSugam,
  IconEverest,
  IconOther
} from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { translateCylinder } from '../utils/cylinderTranslator';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';

const API_URL = import.meta.env.VITE_API_URL;

function DealerRefill({ showToast }) {
  const { language } = useLanguage();
  const [refillDate, setRefillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [refills, setRefills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('normal');
  const [showHistory, setShowHistory] = useState(false);
  
  const [lokpriyaGive, setLokpriyaGive] = useState(0);
  const [lokpriyaTake, setLokpriyaTake] = useState(0);
  const [sugamGive, setSugamGive] = useState(0);
  const [sugamTake, setSugamTake] = useState(0);
  const [everestGive, setEverestGive] = useState(0);
  const [everestTake, setEverestTake] = useState(0);
  const [otherGive, setOtherGive] = useState(0);
  const [otherTake, setOtherTake] = useState(0);
  const [notes, setNotes] = useState('');

  // Cylinder sections with display names using translateCylinder - Now reactive to language changes
  const cylinderSections = useMemo(() => [
    { 
      key: 'lokpriya',
      label: translateCylinder('लोकप्रिय', language),
      give: lokpriyaGive, 
      setGive: setLokpriyaGive, 
      take: lokpriyaTake, 
      setTake: setLokpriyaTake, 
      icon: <IconLokpriya className="w-8 h-8" /> 
    },
    { 
      key: 'sugam',
      label: translateCylinder('सुगम', language),
      give: sugamGive, 
      setGive: setSugamGive, 
      take: sugamTake, 
      setTake: setSugamTake, 
      icon: <IconSugam className="w-8 h-8" /> 
    },
    { 
      key: 'everest',
      label: translateCylinder('एभरेस्ट', language),
      give: everestGive, 
      setGive: setEverestGive, 
      take: everestTake, 
      setTake: setEverestTake, 
      icon: <IconEverest className="w-8 h-8" /> 
    },
    { 
      key: 'other',
      label: translateCylinder('अन्य', language),
      give: otherGive, 
      setGive: setOtherGive, 
      take: otherTake, 
      setTake: setOtherTake, 
      icon: <IconOther className="w-8 h-8" /> 
    }
  ], [language, lokpriyaGive, lokpriyaTake, sugamGive, sugamTake, everestGive, everestTake, otherGive, otherTake]);

  useEffect(() => {
    loadRefillHistory();
  }, []);

  const loadRefillHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/refills`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setRefills(data.refills);
      }
    } catch (error) {
      console.error('Error loading refills:', error);
    }
  };

  const saveRefill = async () => {
    setLoading(true);
    try {
      let sendData;
      
      if (mode === 'normal') {
        sendData = {
          refillDate,
          lokpriyaFilled: lokpriyaGive,
          lokpriyaEmpty: lokpriyaTake,
          sugamFilled: sugamGive,
          sugamEmpty: sugamTake,
          everestFilled: everestGive,
          everestEmpty: everestTake,
          otherFilled: otherGive,
          otherEmpty: otherTake,
          notes,
          mode: 'normal'
        };
      } else {
        sendData = {
          refillDate,
          mode: 'exchange',
          notes: notes || t('emptyExchange', language),
          exchange_give_lokpriya: lokpriyaGive,
          exchange_give_sugam: sugamGive,
          exchange_give_everest: everestGive,
          exchange_give_other: otherGive,
          exchange_take_lokpriya: lokpriyaTake,
          exchange_take_sugam: sugamTake,
          exchange_take_everest: everestTake,
          exchange_take_other: otherTake
        };
      }
      
      const response = await fetch(`${API_URL}/refills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          
        },
        body: JSON.stringify(sendData),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast(mode === 'normal' ? t('refillSaved', language) : t('exchangeSaved', language), 'success');
        
        // Reset form
        setLokpriyaGive(0);
        setLokpriyaTake(0);
        setSugamGive(0);
        setSugamTake(0);
        setEverestGive(0);
        setEverestTake(0);
        setOtherGive(0);
        setOtherTake(0);
        setNotes('');
        
        await loadRefillHistory();
        
      } else {
        const errorMessage = data.message || (mode === 'normal' ? t('refillFailed', language) : t('exchangeFailed', language));
        showToast(errorMessage, 'error');
      }
      
    } catch (error) {
      console.error('Save error:', error);
      showToast(t('networkError', language), 'error');
    }
    setLoading(false);
  };

  const handleNumberChange = (setter, value) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const num = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
    if (num >= 0 && num <= 999) {
      setter(num);
    }
  };

  const formatValue = (val) => val === 0 ? '' : val;

  const getTotalStats = () => {
    const totalFilled = refills.reduce((sum, r) => sum + (r.lokpriya_filled || 0) + (r.sugam_filled || 0) + (r.everest_filled || 0) + (r.other_filled || 0), 0);
    const totalEmpty = refills.reduce((sum, r) => sum + (r.lokpriya_empty || 0) + (r.sugam_empty || 0) + (r.everest_empty || 0) + (r.other_empty || 0), 0);
    return { totalFilled, totalEmpty };
  };

  const { totalFilled, totalEmpty } = getTotalStats();

  if (showHistory) {
    return (
      <div className="space-y-5 pb-24">
        <button
          onClick={() => setShowHistory(false)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors font-medium"
        >
          <IconChevronLeft className="w-5 h-5" />
          <span>{t('newRefill', language)}</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">{t('refillHistory', language)}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t('totalRefills', language)}: {refills.length}</p>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <IconFilledCylinder className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-700">{totalFilled}</div>
                <div className="text-base text-gray-600 mt-1 font-medium">{t('totalFilled', language)}</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <IconEmptyCylinder className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <div className="text-3xl font-bold text-red-600">{totalEmpty}</div>
                <div className="text-base text-gray-600 mt-1 font-medium">{t('totalEmpty', language)}</div>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {refills.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-lg">{t('noRefills', language)}</div>
              ) : (
                refills.map((r, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-700 mb-3 pb-2 border-b border-gray-200">
                      <IconCalendar className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-base">{r.refill_date}</span>
                      {r.mode === 'exchange' && (
                        <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                          {t('exchange', language)}
                        </span>
                      )}
                    </div>
                    {r.mode === 'exchange' ? (
                      <>
                        <div className="space-y-2 text-base">
                          {(r.exchange_give_lokpriya !== 0 || r.exchange_take_lokpriya !== 0) && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IconLokpriya className="w-6 h-6" />
                                <span>{translateCylinder('लोकप्रिय', language)}</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="text-green-600">+{r.exchange_give_lokpriya || 0}</span>
                                <span className="text-red-600">-{r.exchange_take_lokpriya || 0}</span>
                              </div>
                            </div>
                          )}
                          {(r.exchange_give_sugam !== 0 || r.exchange_take_sugam !== 0) && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IconSugam className="w-6 h-6" />
                                <span>{translateCylinder('सुगम', language)}</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="text-green-600">+{r.exchange_give_sugam || 0}</span>
                                <span className="text-red-600">-{r.exchange_take_sugam || 0}</span>
                              </div>
                            </div>
                          )}
                          {(r.exchange_give_everest !== 0 || r.exchange_take_everest !== 0) && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IconEverest className="w-6 h-6" />
                                <span>{translateCylinder('एभरेस्ट', language)}</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="text-green-600">+{r.exchange_give_everest || 0}</span>
                                <span className="text-red-600">-{r.exchange_take_everest || 0}</span>
                              </div>
                            </div>
                          )}
                          {(r.exchange_give_other !== 0 || r.exchange_take_other !== 0) && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IconOther className="w-6 h-6" />
                                <span>{translateCylinder('अन्य', language)}</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="text-green-600">+{r.exchange_give_other || 0}</span>
                                <span className="text-red-600">-{r.exchange_take_other || 0}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-medium text-purple-600 mt-2">{t('emptyExchangeLabel', language)}</div>
                      </>
                    ) : (
                      <div className="space-y-2 text-base">
                        {(r.lokpriya_filled !== 0 || r.lokpriya_empty !== 0) && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconLokpriya className="w-6 h-6" />
                              <span>{translateCylinder('लोकप्रिय', language)}</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-green-600">+{r.lokpriya_filled || 0}</span>
                              <span className="text-red-600">-{r.lokpriya_empty || 0}</span>
                            </div>
                          </div>
                        )}
                        {(r.sugam_filled !== 0 || r.sugam_empty !== 0) && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconSugam className="w-6 h-6" />
                              <span>{translateCylinder('सुगम', language)}</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-green-600">+{r.sugam_filled || 0}</span>
                              <span className="text-red-600">-{r.sugam_empty || 0}</span>
                            </div>
                          </div>
                        )}
                        {(r.everest_filled !== 0 || r.everest_empty !== 0) && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconEverest className="w-6 h-6" />
                              <span>{translateCylinder('एभरेस्ट', language)}</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-green-600">+{r.everest_filled || 0}</span>
                              <span className="text-red-600">-{r.everest_empty || 0}</span>
                            </div>
                          </div>
                        )}
                        {(r.other_filled !== 0 || r.other_empty !== 0) && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconOther className="w-6 h-6" />
                              <span>{translateCylinder('अन्य', language)}</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-green-600">+{r.other_filled || 0}</span>
                              <span className="text-red-600">-{r.other_empty || 0}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {r.notes && <div className="text-sm text-gray-500 mt-2 pt-1 border-t border-gray-100 italic">{r.notes}</div>}
                  </div>
                ))
              )}
            </div>

            <button
              onClick={loadRefillHistory}
              className="w-full mt-5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <IconRefresh className="w-5 h-5" />
              {t('refresh', language)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Page Header */}
      <PageHeader
        title={t('dealerRefill', language)}
        subtitle={t('refillDetails', language)}
        icon={IconDealer}
        action={
          <Button onClick={() => setShowHistory(true)} size="sm" icon={IconRefresh}>
            {t('viewHistory', language)}
          </Button>
        }
      />

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{t('refillForm', language)}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t('enterRefillDetails', language)}</p>
        </div>

        <div className="p-6">
          {/* Mode Toggle Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setMode('normal')}
              className={`py-3 rounded-lg font-semibold text-base transition-all ${
                mode === 'normal'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div>{t('normalRefill', language)}</div>
            </button>
            <button
              onClick={() => setMode('exchange')}
              className={`py-3 rounded-lg font-semibold text-base transition-all ${
                mode === 'exchange'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div>{t('emptyExchange', language)}</div>
            </button>
          </div>

          {/* Info Box */}
          <div className={`p-4 rounded-lg mb-6 text-sm ${
            mode === 'normal' ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'
          }`}>
            {mode === 'normal' ? (
              <>
                <p className="font-semibold mb-2">{t('normalRefillInfo', language)}</p>
                <p className="text-gray-700">• <span className="text-green-600 font-bold">{t('give', language)}</span> → {t('normalGiveDesc', language)}</p>
                <p className="text-gray-700">• <span className="text-red-600 font-bold">{t('take', language)}</span> → {t('normalTakeDesc', language)}</p>
              </>
            ) : (
              <>
                <p className="font-semibold mb-2">{t('exchangeRefillInfo', language)}</p>
                <p className="text-gray-700">• <span className="text-green-600 font-bold">{t('give', language)}</span> → {t('exchangeGiveDesc', language)}</p>
                <p className="text-gray-700">• <span className="text-red-600 font-bold">{t('take', language)}</span> → {t('exchangeTakeDesc', language)}</p>
              </>
            )}
          </div>

          {/* Date Input */}
          <div className="mb-6">
            <label htmlFor="dr-date" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <IconCalendar className="w-4 h-4" />
              {t('date', language)}
            </label>
            <input
              id="dr-date"
              type="date"
              value={refillDate}
              onChange={(e) => setRefillDate(e.target.value)}
              className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          {/* Cylinder Input Sections - Using dynamic labels */}
          {cylinderSections.map((brand, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-5 mb-5 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                {brand.icon}
                <span className="font-semibold text-gray-900 text-base">{brand.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor={`dr-${brand.key}-give`} className="text-sm font-semibold text-green-700 mb-2 block flex items-center gap-1 uppercase">
                    <IconFilledCylinder className="w-4 h-4" />
                    {t('give', language)}
                  </label>
                  <input
                    id={`dr-${brand.key}-give`}
                    type="text"
                    inputMode="numeric"
                    value={formatValue(brand.give)}
                    onChange={(e) => handleNumberChange(brand.setGive, e.target.value)}
                    className="w-full p-3 text-center text-xl font-bold border border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                    placeholder="०"
                  />
                </div>
                <div>
                  <label htmlFor={`dr-${brand.key}-take`} className="text-sm font-semibold text-red-700 mb-2 block flex items-center gap-1 uppercase">
                    <IconEmptyCylinder className="w-4 h-4" />
                    {t('take', language)}
                  </label>
                  <input
                    id={`dr-${brand.key}-take`}
                    type="text"
                    inputMode="numeric"
                    value={formatValue(brand.take)}
                    onChange={(e) => handleNumberChange(brand.setTake, e.target.value)}
                    className="w-full p-3 text-center text-xl font-bold border border-red-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                    placeholder="०"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="dr-notes" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('notes', language)} <span className="text-xs font-normal text-gray-500">({t('optional', language)})</span>
            </label>
            <textarea
              id="dr-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="1"
              placeholder={''}
              className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={saveRefill}
            disabled={loading}
            loading={loading}
            icon={IconPlus}
            size="lg"
            fullWidth
          >
            {loading ? `${t('saving', language)}...` : t('saveRefill', language)}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DealerRefill;