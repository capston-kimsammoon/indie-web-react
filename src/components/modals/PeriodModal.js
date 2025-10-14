// src/components/modals/PeriodModal.js
import styled from 'styled-components';
import React, { useState } from 'react';

export default function PeriodModal({ startYear, startMonth, endYear, endMonth, onChange, onClose }) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  const [tempStartYear, setTempStartYear] = useState(startYear);
  const [tempStartMonth, setTempStartMonth] = useState(startMonth);
  const [tempEndYear, setTempEndYear] = useState(endYear);
  const [tempEndMonth, setTempEndMonth] = useState(endMonth);

  const handleApply = () => {
    onChange({
      startYear: tempStartYear,
      startMonth: tempStartMonth,
      endYear: tempEndYear,
      endMonth: tempEndMonth,
    });
    onClose();
  };

  return (
    <Backdrop onClick={onClose}>
      <BottomSheet onClick={(e) => e.stopPropagation()}>
        <Title>기간 설정</Title>

        <PickerRow>
          <PickerGroup>
            <Picker>
              <SelectWrapper>
                <select
                  value={tempStartYear}
                  onChange={(e) => setTempStartYear(Number(e.target.value))}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </SelectWrapper>
            </Picker>

            <Picker>
              <SelectWrapper>
                <select
                  value={tempStartMonth}
                  onChange={(e) => setTempStartMonth(Number(e.target.value))}
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </SelectWrapper>
            </Picker>
          </PickerGroup>

          <Divider>-</Divider>

          <PickerGroup>
            <Picker>
              <SelectWrapper>
                <select
                  value={tempEndYear}
                  onChange={(e) => setTempEndYear(Number(e.target.value))}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </SelectWrapper>
            </Picker>

            <Picker>
              <SelectWrapper>
                <select
                  value={tempEndMonth}
                  onChange={(e) => setTempEndMonth(Number(e.target.value))}
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </SelectWrapper>
            </Picker>
          </PickerGroup>
        </PickerRow>

        <CloseButton onClick={handleApply}>적용</CloseButton>
      </BottomSheet>
    </Backdrop>
  );
}
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 1001;
`;

const BottomSheet = styled.div`
  position: relative;
  width: 100%;
  max-width: var(--app-max-width, ${({ theme }) => theme.layout.maxWidth});
  background: ${({ theme }) => theme.colors.bgWhite};
  border-radius: 12px 12px 0 0;
  padding: 16px;
  padding-bottom: 40px;
  box-sizing: border-box;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
`;

const CloseButton = styled.button`
  display: block;
  margin-top: 16px;
  margin-bottom: 0px;
  margin-left: auto;
  margin-right: 4px;
  padding: 6px 12px;
  background-color: ${({ theme }) => theme.colors.themeGreen};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: 8px;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;

  &:hover {
    background-color: #2a8a55ff;
  }
`;

const Title = styled.div`
  line-height: 24px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.black};
`;

const PickerRow = styled.div`
  position: relative; 
  display: flex;
  align-items: center;
  justify-content: space-between; 
  margin-top: 16px;
`;

const PickerGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 40%; 
`;

const Picker = styled.div`
  display: flex;
`;

const SelectWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border: 1.4px solid ${({ theme }) => theme.colors.outlineGray};
  border-radius: 50px;
  background: ${({ theme }) => theme.colors.bgWhite};
  flex: 1;
  min-width: 0;

  select {
    border: none;
    outline: none;
    background: transparent;
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.darkGray};
    text-align: center;
    width: 100%;

    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;

    /* IE 전용 */
    &::-ms-expand {
      display: none;
    }
  }
`;

const Divider = styled.span`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.darkGray};
`;

