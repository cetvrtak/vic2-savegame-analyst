import React, { useEffect, useState } from 'react';
import PopTypes from '../assets/poptypes.json';
import Defines from '../assets/defines.json';

const popTypes: any = PopTypes;
const defines: any = Defines;

type Pops = {
  [key: string]: number;
};

type Province = {
  [key: string]: any;
};

interface PopsNeedsProps {
  provinces: Province[];
  plurality: number;
  inventions: number[];
}

const PopsNeeds: React.FC<PopsNeedsProps> = ({
  provinces,
  plurality,
  inventions,
}) => {
  const [popsNeeds, setPopsNeeds] = useState<Pops>({
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
    const calculateNeeds = () => {
      const popsNeeds: Pops = {
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

      // Needs = (1 + Plurality) * (1 + 2 * CON / PDEF_BASE_CON[Defines.lua) * (1 + inventions * INVENTION_IMPACT_ON_DEMAND[Defines.lua]) * base[pop file] * BASE_GOODS_DEMAND[Defines.lua] * pop size / 200000
      const pluralityModifier: number = 1 + plurality / 100;
      const PDEF_BASE_CON = Number(defines.pops.PDEF_BASE_CON);

      const numInventions = inventions.length;
      const INVENTION_IMPACT_ON_DEMAND = Number(
        defines.pops.INVENTION_IMPACT_ON_DEMAND
      );
      const inventionsModifier = 1 + numInventions * INVENTION_IMPACT_ON_DEMAND;

      const BASE_GOODS_DEMAND: number = Number(defines.pops.BASE_GOODS_DEMAND);

      provinces.forEach((province) => {
        for (const key in province) {
          if (popsNeeds.hasOwnProperty(key)) {
            const baseLife: number =
              Number(popTypes[key].life_needs?.cattle) || 0;
            const baseEveryday: number =
              Number(popTypes[key].everyday_needs?.cattle) || 0;
            const baseLuxury: number =
              Number(popTypes[key].luxury_needs?.cattle) || 0;

            const popType = Array.isArray(province[key])
              ? province[key]
              : [province[key]];

            for (const pop of popType) {
              const con = pop.con || 0;
              const consciousnessModifier = 1 + (2 * con) / PDEF_BASE_CON;
              const popSize = +pop.size;

              const needs =
                (pluralityModifier *
                  consciousnessModifier *
                  (baseLife +
                    inventionsModifier * baseEveryday +
                    inventionsModifier * baseLuxury) *
                  BASE_GOODS_DEMAND *
                  popSize) /
                200000;

              popsNeeds[key] += needs;
              // console.log(`${province.name} ${key} (${popSize}) ${needs}`);
            }
          }
        }
      });

      setPopsNeeds(popsNeeds);
    };

    calculateNeeds();
  }, []);

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Total</th>
            {Object.keys(popsNeeds).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="row">
            <th>Cattle</th>
            <td>
              {Math.round(
                Object.entries(popsNeeds).reduce(
                  (acc, val) => (acc += val[1]),
                  0
                ) * 100
              ) / 100}
            </td>
            {Object.entries(popsNeeds).map(([key, value]) => (
              <td key={key}>{Math.round(value * 100) / 100}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PopsNeeds;
