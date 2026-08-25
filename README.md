# Solar PV ROI Calculator

A comprehensive single-page web application for calculating the return on investment (ROI) for solar photovoltaic (PV) installations.

## Features

✅ **Flexible Input Modes**
- Installation Cost: Enter as gross amount or calculate from capacity × unit rate
- Subsidies: Enter as gross amount or per-kWp rate

✅ **Comprehensive Calculations**
- Net Upfront Cost (after subsidies)
- Self-consumed solar energy optimization (capped at 35% of annual consumption)
- Annual savings from self-consumption and exported energy
- Payback period calculation
- 25-year net profit projection

✅ **Visual Analytics**
- Interactive 25-year cumulative cash flow chart
- Automatic breakeven point visualization
- Real-time calculations as you adjust inputs

✅ **Export Functionality**
- Download 25-year cash flow chart as PNG
- Date-stamped file names for easy organization

## Installation

1. Simply open `index.html` in a modern web browser
2. No server or installation required
3. Works offline once loaded

## How to Use

### 1. Set Installation Cost Mode
Choose between:
- **Gross Amount**: Enter total installation cost directly
- **Capacity × Unit Rate**: Enter system capacity (kWp) and cost per kWp

### 2. Enter Subsidy Information
- **Gross Amount**: Enter total subsidies
- **Unit Rate**: Enter subsidy per kWp

### 3. Provide System & Consumption Data
- Annual Solar Production kWh/year
- Annual Household Consumption kWh/year
- Electricity Buying Price (€/kWh)
- Electricity Selling Price / Feed-In Tariff (€/kWh)

### 4. Review Results
- View 4 key metrics on summary cards
- Analyze 25-year cash flow with breakeven point
- Download the chart for reports or presentations

## Calculation Logic

### Self-Consumed Solar
`Min(Annual Production, Annual Consumption × 0.35)`

The app assumes up to 35% of annual household consumption can be met by solar self-consumption.

### Exported Solar
`Max(0, Annual Production - Self-Consumed Solar)`

Any surplus production is exported to the grid.

### Annual Savings
`(Self-Consumed Solar × Buying Price) + (Exported Solar × Selling Price)`

### Payback Period
`Net Upfront Cost ÷ Annual Savings`

### 25-Year Net Profit
`(Annual Savings × 25) - Net Upfront Cost`

## Browser Compatibility

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

All dependencies are loaded from CDN:
- **Chart.js** - Interactive charting library
- **html2canvas** - Screenshot/canvas capture
- **jsPDF** - PDF export support

## File Structure

```
roi_app/
├── index.html      # Main HTML structure
├── styles.css      # Styling and layout
├── script.js       # All calculation and interaction logic
└── README.md       # This file
```

## Tips for Accurate Results

1. **Solar Production**: Use generation data from similar installations in your region or solar calculator tools
2. **Consumption**: Review your annual electricity bills for accurate consumption figures
3. **Electricity Prices**: Check your local electricity provider for current rates
4. **Feed-In Tariff**: Verify the current government subsidy or grid purchase rates in your region

## Example Scenario

- Installation Cost: €5,000 (gross)
- Subsidy: €1,000
- Annual Production: 6,000 kWh
- Annual Consumption: 8,000 kWh
- Buying Price: €0.25/kWh
- Selling Price: €0.10/kWh

**Results:**
- Net Upfront Cost: €4,000
- Annual Savings: €700
- Payback Period: ~5.7 years
- 25-Year Net Profit: €13,500

## License

Free to use and modify for personal and commercial purposes.

## Notes

- All calculations are performed in the browser (no data sent to servers)
- Results are estimates and may vary based on real-world conditions
- For accurate financial planning, consult with a solar installation professional
