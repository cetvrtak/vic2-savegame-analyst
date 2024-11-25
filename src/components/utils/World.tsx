// Use World class to derive world/game data
// As opposed to:
//  * Save game data - retrieved directly AppState
//  * Game files data - retrieved from DataContext
class World {
  saveData: Record<string, any>;

  // Game files
  productionTypes: Record<string, any>;

  // Derived data
  goodsOutput: Record<string, number>;

  constructor(saveData: Record<string, any>, filesData: Record<string, any>) {
    this.saveData = saveData;

    this.productionTypes = filesData.production_types;

    this.goodsOutput = this.CreateGoodOutputMap();
  }

  private CreateGoodOutputMap = (): Record<string, number> => {
    return Object.values(this.productionTypes).reduce(
      (map: Record<string, number>, type: Record<string, any>) =>
        type.output_goods && {
          ...map,
          [type.output_goods]: Number(type.value),
        },
      {}
    );
  };
}

export default World;
