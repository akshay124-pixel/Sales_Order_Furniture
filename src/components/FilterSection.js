import { Form, Button, Dropdown } from "react-bootstrap";
import { FaBell } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ArrowRight } from "lucide-react";
import styled from "styled-components";
import { OverlayTrigger } from "react-bootstrap";

// Styled components
const FilterContainer = styled.div`
  background: rgb(230, 240, 250);
  padding: 0.75rem;
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  font-family: "Inter", sans-serif;

  @media (max-width: 1023px) {
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: flex-start;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1rem;
  }
`;

const SearchInput = styled(Form.Control)`
  flex: 0 0 18%;
  min-width: 160px;
  padding: 0.7rem 1rem;
  border-radius: 0.75rem;
  border: none;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease-in-out;

  &:focus {
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
    transform: scale(1.02);
    outline: none;
  }

  @media (max-width: 1023px) {
    flex: 0 0 25%;
    min-width: 140px;
  }

  @media (max-width: 768px) {
    flex: 0 0 100%;
    font-size: 0.95rem;
    padding: 0.8rem 1rem;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  align-items: center;
  flex: 1;
  justify-content: space-between;

  @media (max-width: 1023px) {
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: flex-start;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    flex: 0 0 100%;
    gap: 1rem;
  }
`;

const DatePickerWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex: 0 0 28%;

  .react-datepicker-wrapper {
    flex: 1;
  }

  input {
    padding: 0.7rem 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    font-size: 0.85rem;
    width: 80%;
    transition: all 0.3s ease-in-out;

    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.2);
      transform: scale(1.02);
      outline: none;
    }
  }

  @media (max-width: 1023px) {
    flex: 0 0 35%;
    input {
      font-size: 0.8rem;
      padding: 0.6rem 0.7rem;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    flex: 0 0 100%;
    gap: 1rem;

    input {
      font-size: 0.95rem;
      padding: 0.8rem 1rem;
    }
  }
`;

const StyledButton = styled(Button)`
  background: linear-gradient(135deg, #2575fc, #6a11cb);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.7rem 1rem;
  border-radius: 0.75rem;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease-in-out;
  flex: 0 0 auto;
  white-space: nowrap;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    opacity: 0.9;
  }

  @media (max-width: 768px) {
    flex: 0 0 100%;
    justify-content: center;
    font-size: 0.95rem;
    padding: 0.8rem 1rem;
  }
`;

const StyledDropdownToggle = styled(Dropdown.Toggle)`
  background: linear-gradient(135deg, #2575fc, #6a11cb);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.7rem 0.75rem;
  border-radius: 0.75rem;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease-in-out;
  flex: 1;
  max-width: 150px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    opacity: 0.9;
  }

  @media (max-width: 1023px) {
    max-width: 120px;
    font-size: 0.8rem;
    padding: 0.6rem 0.7rem;
  }

  @media (max-width: 768px) {
    flex: 0 0 100%;
    max-width: none;
    font-size: 0.95rem;
    padding: 0.8rem 1rem;
  }
`;

const StyledDropdownMenu = styled(Dropdown.Menu)`
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  background: white;
  border: none;
  padding: 0.5rem;
  min-width: 180px;

  @media (max-width: 768px) {
    min-width: 100%;
  }
`;

const StyledDropdownItem = styled(Dropdown.Item)`
  padding: 0.5rem 0.75rem;
  color: #1e40af;
  font-weight: 500;
  font-size: 0.9rem;
  transition: background 0.3s ease-in-out;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  &:focus,
  &:active {
    background: rgba(59, 130, 246, 0.2);
    color: #1e40af;
  }
`;

const NotificationWrapper = styled.div`
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.5rem;
  flex: 0 0 auto;
`;

const NotificationIcon = styled(FaBell)`
  font-size: 1.25rem;
  color: #4b5563;
  transition: all 0.3s ease-in-out;

  &:hover {
    color: #3b82f6;
    transform: scale(1.1);
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: 600;
`;

// Reusable Dropdown Component
const FilterDropdown = ({ id, label, value, onChange, options, tableId }) => (
  <Dropdown>
    <StyledDropdownToggle id={id} aria-controls={tableId}>
      {value === "All" ? label : value}
    </StyledDropdownToggle>
    <StyledDropdownMenu>
      {options.map((option) => (
        <StyledDropdownItem
          key={option}
          onClick={() => onChange(option)}
          aria-label={`Select ${label} filter: ${option}`}
        >
          {option}
        </StyledDropdownItem>
      ))}
    </StyledDropdownMenu>
  </Dropdown>
);

// Filter Section Component
const FilterSection = ({
  debouncedSetSearchTerm,
  userRole,
  notificationPopover,
  notifications,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  productionStatusFilter,
  setProductionStatusFilter,
  installStatusFilter,
  setInstallStatusFilter,
  productStatus,
  setProductStatusFilter,
  accountsStatusFilter,
  setAccountsStatusFilter,
  dispatchFilter,
  setDispatchFilter,
  handleReset,
  tableId = "orders-table",
}) => {
  return (
    <FilterContainer>
      <SearchInput
        type="text"
        placeholder="Search Orders..."
        onChange={(e) => debouncedSetSearchTerm(e.target.value)}
        aria-label="Search orders by keyword"
      />
      <FilterGroup>
        {(userRole === "Admin" || userRole === "SuperAdmin") && (
          <OverlayTrigger
            trigger="click"
            placement="bottom"
            overlay={notificationPopover}
            rootClose
          >
            <NotificationWrapper aria-label="View notifications">
              <NotificationIcon />
              {notifications.filter((notif) => !notif.isRead).length > 0 && (
                <NotificationBadge>
                  {notifications.filter((notif) => !notif.isRead).length}
                </NotificationBadge>
              )}
            </NotificationWrapper>
          </OverlayTrigger>
        )}
        <DatePickerWrapper>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start Date"
            dateFormat="dd/MM/yyyy"
            isClearable
            aria-label="Select order start date"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            placeholderText="End Date"
            dateFormat="dd/MM/yyyy"
            isClearable
            aria-label="Select order end date"
          />
        </DatePickerWrapper>
        <FilterDropdown
          id="production-status-filter"
          label="Production Status"
          value={productionStatusFilter}
          onChange={setProductionStatusFilter}
          options={[
            "All",
            "Pending",
            "Under Process",
            "Partial Dispatch",
            "Fulfilled",
          ]}
          tableId={tableId}
        />
        <FilterDropdown
          id="product-status-filter"
          label="Product Type"
          value={productStatus}
          onChange={setProductStatusFilter}
          options={[
            "All",
            "Chairs",
            "Tables",
            "Sheet Metal",
            "Desking",
            "Solid Wood",
            "Boards",
            "Lab Tables",
            "Others",
          ]}
          tableId={tableId}
        />
        <FilterDropdown
          id="installation-status-filter"
          label="Installation Status"
          value={installStatusFilter}
          onChange={setInstallStatusFilter}
          options={["All", "Pending", "In Progress", "Completed"]}
          tableId={tableId}
        />
        <FilterDropdown
          id="dispatch-status-filter"
          label="Dispatch Status"
          value={dispatchFilter}
          onChange={setDispatchFilter}
          options={["All", "Not Dispatched", "Dispatched", "Delivered"]}
          tableId={tableId}
        />
        <FilterDropdown
          id="accounts-status-filter"
          label="Accounts Status"
          value={accountsStatusFilter}
          onChange={setAccountsStatusFilter}
          options={["All", "Not Received", "Received"]}
          tableId={tableId}
        />
        <StyledButton onClick={handleReset} aria-label="Reset all filters">
          Reset <ArrowRight size={16} />
        </StyledButton>
      </FilterGroup>
    </FilterContainer>
  );
};

export default FilterSection;
