import {
  Question,
  QuestionSelectBase,
  ItemValue,
  QuestionMatrixModel
} from "survey-core";
import Chart from "chart.js";
import { VisualizationManager, VisualizerBase } from "../visualizationManager";

export class ChartJS extends VisualizerBase {
  constructor(
    private targetNode: HTMLElement,
    public question: Question,
    protected data: Array<{ [index: string]: any }>,
    private options?: Object
  ) {
    super(targetNode, question, data, options);
  }

  private chart: Chart;

  protected chartTypes = ["bar", "horizontalBar", "line", "pie", "doughnut"];
  chartType = "horizontalBar";

  destroy() {
    if (!!this.chart) {
      this.chart.destroy();
      this.chart = undefined;
      this.targetNode.innerHTML = "";
    }
  }

  render() {
    const chartNodeContainer = document.createElement("div");
    const toolbarNodeContainer = document.createElement("div");
    const chartNode = <HTMLCanvasElement>document.createElement("canvas");

    chartNodeContainer.appendChild(toolbarNodeContainer);
    chartNodeContainer.appendChild(chartNode);
    this.targetNode.appendChild(chartNodeContainer);

    this.chart = this.getChartJs(chartNode, this.chartType);

    this.createToolbar(toolbarNodeContainer, (e: any) => {
      if (this.chartType !== e.target.value) {
        this.chartType = e.target.value;
        this.chart.destroy();
        this.chart = this.getChartJs(chartNode, this.chartType);
      }
    });
  }

  private createToolbar(
    container: HTMLDivElement,
    changeHandler: (e: any) => void
  ) {
    if (this.chartTypes.length > 0) {
      const select = document.createElement("select");
      this.chartTypes.forEach(chartType => {
        let option = document.createElement("option");
        option.value = chartType;
        option.text = chartType;
        option.selected = this.chartType === chartType;
        select.appendChild(option);
      });
      select.onchange = changeHandler;
      container.appendChild(select);
    }
  }

  private getChartJs(chartNode: HTMLCanvasElement, chartType: string): Chart {
    const ctx = <CanvasRenderingContext2D>chartNode.getContext("2d");
    const question: QuestionSelectBase = <any>this.question;
    const values = this.getValues();

    return new Chart(ctx, {
      type: chartType,
      data: {
        labels: this.getLabels(),
        datasets: this.getDatasets(values)
      },
      options: this.getOptions()
    });
  }

  getOptions(): Chart.ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales:
        ["pie", "doughnut"].indexOf(this.chartType) !== -1
          ? undefined
          : {
              yAxes: [
                {
                  ticks: {
                    beginAtZero: true
                  }
                }
              ]
            }
    };
  }

  valuesSource(): any[] {
    const question: QuestionSelectBase = <any>this.question;
    return question.choices;
  }

  getValues(): Array<any> {
    const values: Array<any> = this.valuesSource().map(choice => choice.value);
    return values;
  }

  getLabels(): Array<string> {
    const values: Array<any> = this.getValues();
    const labels: Array<string> = this.valuesSource().map(choice =>
      ItemValue.getTextOrHtmlByValue(this.valuesSource(), choice.value)
    );
    return labels;
  }

  getData(values: Array<any>): any[] {
    const statistics = values.map(v => 0);
    this.data.forEach(row => {
      const rowValue: any = row[this.question.name];
      if (!!rowValue) {
        if (Array.isArray(rowValue)) {
          values.forEach((val: any, index: number) => {
            if (rowValue.indexOf(val) !== -1) {
              statistics[index]++;
            }
          });
        } else {
          values.forEach((val: any, index: number) => {
            if (rowValue == val) {
              statistics[index]++;
            }
          });
        }
      }
    });
    return statistics;
  }

  getDatasets(values: Array<any>): any[] {
    const question: QuestionMatrixModel = <any>this.question;
    return [
      {
        label: question.title,
        data: this.getData(values),
        backgroundColor: values.map(_ => this.getRandomColor())
      }
    ];
  }
}

VisualizationManager.registerVisualizer("checkbox", ChartJS);
VisualizationManager.registerVisualizer("radiogroup", ChartJS);
VisualizationManager.registerVisualizer("dropdown", ChartJS);
VisualizationManager.registerVisualizer("imagepicker", ChartJS);