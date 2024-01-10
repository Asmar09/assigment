import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import PropTypes from 'prop-types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import ReactLoading from "react-loading"
import './App.css';
import { FileUploader } from './UploadFile';

const App = () => {
  const [rowData, setRowData] = useState([]);
  const [columnData, setColumnData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 50;

  const handleFileUpload = (file) => {
    setLoading(true);
    const reader = new FileReader();
  
    reader.onload = (e) => {
      const data = e.target.result;
      try{
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
  
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const columns = Object.keys(jsonData[0]);

      setRowData([]);
      setColumnData([]);


      setRowData(jsonData);
      setColumnData(columns);
      setLoading(false);
    }
    catch(error){
      setLoading(false);
      console.error('Error reading or processing the file:', error.message);
    }
  }
  
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
             <div style={{display: "flex", justifyContent: "space-between", marginTop: "-15px"}}><p style={{fontSize:"12", fontWeight: "200"}}>unique values:</p>  <p style={{fontSize:"12", fontWeight: "200"}}>{totalItems}</p></div> 
          </div>
        );
      }

      // const chartData = columnData.reduce((acc, value) => {
      //   acc[value] = (acc[value] || 0) + 1;
      //   return acc;
      // }, {});
  
      // const chartDataArray = Object.keys(chartData).map((key) => ({
      //   name: key,
      //   value: chartData[key],
      // }));
  
      const bins = calculateHistogramBins(columnData, 10); 

      const chartData = bins.map((bin) => ({
        bin: `${bin.start.toFixed(2)} - ${bin.end.toFixed(2)}`,
        count: bin.length,
      }));
  
      return (
        <div className="chart-cell">
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData}>
              <Bar dataKey="count" fill="#8884d8" />
              <XAxis dataKey="bin" hide={true} />
              <YAxis hide={true} />
              <Tooltip />
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
             <div style={{display: "flex", justifyContent: "space-between", marginTop: "-15px"}}><p style={{fontSize:"12", fontWeight: "200"}}>unique values:</p>  <p style={{fontSize:"12", fontWeight: "200"}}>{totalItems}</p></div> 
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
           <div style={{display: "flex", justifyContent: "space-between", marginTop: "-15px"}}><p style={{fontSize:"12", fontWeight: "200"}} key={value}>{value.length > 20 ? `${value.slice(0,20)}: ` : `${value}: `}</p> <p style={{fontSize:"12", fontWeight: "200"}}>{`${percentage.toFixed(2)}%`}</p></div>
            ))}
          <div style={{display: "flex", justifyContent: "space-between", marginTop: "-15px"}}><p style={{fontSize:"12", fontWeight: "200"}}>Other:</p>  <p style={{fontSize:"12", fontWeight: "200"}}>{`${remainingPercentage.toFixed(2)}%`}</p></div> 
          </div>
        );
      }
    }
  };


  ChartCell.propTypes = {
    columnName: PropTypes.string.isRequired,
    columnData: PropTypes.array.isRequired,
  };
  
  // Function to calculate histogram bins
  const calculateHistogramBins = (data, numBins) => {
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const binWidth = (maxValue - minValue) / numBins;
  
    const bins = Array.from({ length: numBins }, (_, index) => {
      const start = minValue + index * binWidth;
      const end = start + binWidth;
  
      return {
        start,
        end,
        length: data.filter((value) => value >= start && value < end).length,
      };
    });
  
    return bins;
  };
  
  const renderTable = () => {
    if (rowData.length === 0 || columnData.length === 0) {
      return (
        <div style={{margin: "10rem"}}>No File Uploaded yet</div>
      );
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
     <FileUploader handleFile={handleFileUpload} loading={loading} />
     {loading ? (
        <div className="loader"><ReactLoading type="spinningBubbles" color="#000" /></div>
      ) : (
        renderTable()
      )}
    </div>
  );
};

export default App;