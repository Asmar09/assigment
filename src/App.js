import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import './App.css';

const App = () => {
  const [rowData, setRowData] = useState([]);
  const [columnData, setColumnData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);

  const itemsPerPage = 50;


  const handleFileUpload = (file) => {
    const reader = new FileReader();
  
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
  
      // Assuming only one sheet in the workbook
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
  
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
      // Extract column names from the first row
      const columns = Object.keys(jsonData[0]);
  
      setRowData(jsonData);
      setColumnData(columns);
    };
  
    reader.readAsBinaryString(file);
  };
  
  
  const ChartCell = ({ columnData }) => {
    const isNumeric = columnData.every((value) => typeof value === 'number');
  
    if (isNumeric) {
      const uniqueValues = [...new Set(columnData)];
      const totalItems = columnData.length;
  
      if (uniqueValues.length === totalItems) {
        return (
          <div className="chart-cell">
              <p>{`unique values`}</p>
            <p>{totalItems}</p>
          </div>
        );
      }

      const chartData = columnData.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {});
  
      const chartDataArray = Object.keys(chartData).map((key) => ({
        name: key,
        value: chartData[key],
      }));
  
      return (
        <div className="chart-cell">
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartDataArray}>
            <Bar dataKey="value" fill="#8884d8" barSize={50} />
              <XAxis dataKey="name" />
              <YAxis hide />
              <Tooltip />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    } 
    else {
      const totalItems = columnData.length;
      const uniqueValues = [...new Set(columnData)];
  
      if (uniqueValues.length === totalItems) {
        return (
          <div className="chart-cell">
            <p>{`unique values: ${totalItems}`}</p>
            <p>{totalItems}</p>
          </div>
        );
      } else {
        const sortedPercentages = uniqueValues
          .map((value) => ({
            value,
            percentage: (columnData.filter((item) => item === value).length / totalItems) * 100,
          }))
          .sort((a, b) => b.percentage - a.percentage);
  
        const firstTwoPercentages = sortedPercentages.slice(0, 2);
        const remainingPercentage = sortedPercentages.slice(2).reduce((acc, { percentage }) => acc + percentage, 0);
  
        return (
          <div className="chart-cell">
            {firstTwoPercentages.map(({ value, percentage }) => (
              <p key={value}>{`${value}: ${percentage.toFixed(2)}%`}</p>
            ))}
            <p>{`Other(${totalItems - firstTwoPercentages.length}): ${remainingPercentage.toFixed(2)}%`}</p>
          </div>
        );
      }
    }
  };
  
  const renderTable = () => {
    if (rowData.length === 0 || columnData.length === 0) {
      return null;
    }

    const startIndex = currentPage * itemsPerPage;
    const endIndex = Math.min((currentPage + 1) * itemsPerPage, rowData.length);

    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columnData.map((column, index) => (
                <th key={index}>
                  {column}
                </th>
              ))}
            </tr>
            <tr>
              {columnData.map((column, index) => (
                <th key={index}>
                  <ChartCell columnData={rowData.map((row) => row[column])} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowData.slice(startIndex, endIndex).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex} className="cell">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {renderPagination()}
      </div>
    );
  };

  const renderPagination = () => {
    return (
      <div className="pagination">
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))} disabled={currentPage === 0}>
          Previous
        </button>
        <span>{`Page ${currentPage + 1} of ${Math.ceil(rowData.length / itemsPerPage)}`}</span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(rowData.length / itemsPerPage) - 1))}
          disabled={currentPage === Math.ceil(rowData.length / itemsPerPage) - 1}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="app">
      <h1>Excel Upload Project</h1>
      <input type="file" onChange={(e) => handleFileUpload(e.target.files[0])} />
      {renderTable()}
    </div>
  );
};

export default App;