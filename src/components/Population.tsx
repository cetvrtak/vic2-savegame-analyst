import React, { useEffect, useState } from 'react';

type Pops = {
  [key: string]: number;
};

type Province = {
  [key: string]: any;
};

interface PopulationProps {
  provinces: Province[];
}

const Population: React.FC<PopulationProps> = ({ provinces }) => {
  const [population, setPopulation] = useState<Pops>({
    aristocrats: 0,
    artisans: 0,
    bureaucrats: 0,
    capitalists: 0,
    clerks: 0,
    clergymen: 0,
    craftsmen: 0,
    farmers: 0,
    labourers: 0,
    officers: 0,
    serfs: 0,
    slaves: 0,
    soldiers: 0,
  });

  useEffect(() => {
    const calculatePopulation = () => {
      const newPopulation: Pops = {
        aristocrats: 0,
        artisans: 0,
        bureaucrats: 0,
        capitalists: 0,
        clerks: 0,
        clergymen: 0,
        craftsmen: 0,
        farmers: 0,
        labourers: 0,
        officers: 0,
        serfs: 0,
        slaves: 0,
        soldiers: 0,
      };

      provinces.forEach((province) => {
        for (const key in province) {
          if (newPopulation.hasOwnProperty(key)) {
            const pop = province[key];
            const popSize = Array.isArray(pop)
              ? pop.reduce((prev, cur) => (prev += +cur.size), 0)
              : +pop.size;
            // console.log(key, popSize);
            newPopulation[key] += popSize;
          }
        }
      });

      setPopulation(newPopulation);
    };

    calculatePopulation();
  }, [provinces]);

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {Object.keys(population).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="row">
            {Object.entries(population).map(([key, value]) => (
              <td key={key}>{value}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Population;
