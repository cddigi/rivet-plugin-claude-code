import type { ChartNode, Rivet } from "@ironclad/rivet-core";
export type ExamplePluginNode = ChartNode<"examplePlugin", ExamplePluginNodeData>;
export type ExamplePluginNodeData = {
    someData: string;
    useSomeDataInput?: boolean;
};
export declare function examplePluginNode(rivet: typeof Rivet): import("@ironclad/rivet-core").PluginNodeDefinition<ExamplePluginNode>;
