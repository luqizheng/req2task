<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';

const lineChartRef = ref<HTMLElement>();
const barChartRef = ref<HTMLElement>();
const pieChartRef = ref<HTMLElement>();
const scatterChartRef = ref<HTMLElement>();
const radarChartRef = ref<HTMLElement>();
const gaugeChartRef = ref<HTMLElement>();

let lineChart: echarts.ECharts | null = null;
let barChart: echarts.ECharts | null = null;
let pieChart: echarts.ECharts | null = null;
let scatterChart: echarts.ECharts | null = null;
let radarChart: echarts.ECharts | null = null;
let gaugeChart: echarts.ECharts | null = null;

const initLineChart = () => {
  if (!lineChartRef.value) return;
  lineChart = echarts.init(lineChartRef.value);
  const option: echarts.EChartsOption = {
    title: { text: '折线图示例', left: 'center', top: 10 },
    tooltip: { trigger: 'axis' },
    legend: { data: ['销售额', '利润'], top: 50 },
    grid: { top: 100, right: 30, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '销售额',
        type: 'line',
        data: [820, 932, 901, 934, 1290, 1330, 1320, 1500, 1680, 1720, 1850, 2000],
        smooth: true,
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' },
          ]),
        },
      },
      {
        name: '利润',
        type: 'line',
        data: [320, 432, 401, 434, 590, 630, 620, 750, 880, 920, 1050, 1200],
        smooth: true,
        itemStyle: { color: '#67C23A' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' },
          ]),
        },
      },
    ],
  };
  lineChart.setOption(option);
};

const initBarChart = () => {
  if (!barChartRef.value) return;
  barChart = echarts.init(barChartRef.value);
  const option: echarts.EChartsOption = {
    title: { text: '柱状图示例', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['实际值', '目标值'], top: 50 },
    grid: { top: 80, right: 30, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: ['产品A', '产品B', '产品C', '产品D', '产品E', '产品F'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '实际值',
        type: 'bar',
        data: [320, 302, 301, 334, 390, 330],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: '#79bbff' },
          ]),
        },
      },
      {
        name: '目标值',
        type: 'bar',
        data: [220, 182, 191, 234, 290, 230],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#67C23A' },
            { offset: 1, color: '#95d475' },
          ]),
        },
      },
    ],
  };
  barChart.setOption(option);
};

const initPieChart = () => {
  if (!pieChartRef.value) return;
  pieChart = echarts.init(pieChartRef.value);
  const option: echarts.EChartsOption = {
    title: { text: '饼图示例', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left', top: 'middle' },
    series: [
      {
        name: '访问来源',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 20, fontWeight: 'bold' },
        },
        labelLine: { show: false },
        data: [
          { value: 1048, name: '搜索引擎', itemStyle: { color: '#409EFF' } },
          { value: 735, name: '直接访问', itemStyle: { color: '#67C23A' } },
          { value: 580, name: '邮件营销', itemStyle: { color: '#E6A23C' } },
          { value: 484, name: '联盟广告', itemStyle: { color: '#F56C6C' } },
          { value: 300, name: '视频广告', itemStyle: { color: '#909399' } },
        ],
      },
    ],
  };
  pieChart.setOption(option);
};

const initScatterChart = () => {
  if (!scatterChartRef.value) return;
  scatterChart = echarts.init(scatterChartRef.value);
  const data1: [number, number][] = [];
  const data2: [number, number][] = [];
  for (let i = 0; i < 50; i++) {
    data1.push([Math.random() * 100, Math.random() * 100]);
    data2.push([Math.random() * 100, Math.random() * 100]);
  }
  const option: echarts.EChartsOption = {
    title: { text: '散点图示例', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { data: ['数据集A', '数据集B'], top: 30 },
    grid: { top: 80, right: 30, bottom: 30, left: 50 },
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    series: [
      {
        name: '数据集A',
        type: 'scatter',
        data: data1,
        symbolSize: 10,
        itemStyle: { color: '#409EFF' },
      },
      {
        name: '数据集B',
        type: 'scatter',
        data: data2,
        symbolSize: 10,
        itemStyle: { color: '#67C23A' },
      },
    ],
  };
  scatterChart.setOption(option);
};

const initRadarChart = () => {
  if (!radarChartRef.value) return;
  radarChart = echarts.init(radarChartRef.value);
  const option: echarts.EChartsOption = {
    title: { text: '雷达图示例', left: 'center' },
    tooltip: {},
    legend: { data: ['预算分配', '实际开销'], top: 30 },
    radar: {
      center: ['50%', '60%'],
      radius: '60%',
      indicator: [
        { name: '销售', max: 5000 },
        { name: '管理', max: 10000 },
        { name: '信息技术', max: 25000 },
        { name: '客服', max: 25000 },
        { name: '研发', max: 50000 },
        { name: '市场', max: 15000 },
      ],
      axisName: {
        color: '#333',
      },
      splitNumber: 5,
      axisLine: {
        lineStyle: {
          color: '#ddd',
        },
      },
      splitLine: {
        lineStyle: {
          color: '#ddd',
        },
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(64, 158, 255, 0.02)', 'rgba(64, 158, 255, 0.05)'],
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [4200, 3000, 20000, 35000, 50000, 18000],
            name: '预算分配',
            itemStyle: { color: '#409EFF' },
            areaStyle: { color: 'rgba(64, 158, 255, 0.3)' },
          },
          {
            value: [5000, 14000, 28000, 26000, 42000, 21000],
            name: '实际开销',
            itemStyle: { color: '#67C23A' },
            areaStyle: { color: 'rgba(103, 194, 58, 0.3)' },
          },
        ],
      },
    ],
  };
  radarChart.setOption(option);
};

const initGaugeChart = () => {
  if (!gaugeChartRef.value) return;
  gaugeChart = echarts.init(gaugeChartRef.value);
  const option: echarts.EChartsOption = {
    title: { text: '仪表盘示例', left: 'center' },
    series: [
      {
        type: 'gauge',
        center: ['50%', '60%'],
        radius: '80%',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 10,
        itemStyle: { color: '#409EFF' },
        progress: { show: true, width: 20 },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 20 } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        title: { show: false },
        detail: {
          valueAnimation: true,
          width: '60%',
          lineHeight: 40,
          borderRadius: 8,
          offsetCenter: [0, '-5%'],
          fontSize: 30,
          fontWeight: 'bolder',
          formatter: '{value}%',
          color: 'inherit',
        },
        data: [{ value: 75 }],
      },
      {
        type: 'gauge',
        center: ['50%', '60%'],
        radius: '80%',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        itemStyle: { color: '#67C23A' },
        progress: { show: true, width: 8 },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 8 } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: { show: false },
        data: [{ value: 75 }],
      },
    ],
  };
  gaugeChart.setOption(option);
};

const handleResize = () => {
  lineChart?.resize();
  barChart?.resize();
  pieChart?.resize();
  scatterChart?.resize();
  radarChart?.resize();
  gaugeChart?.resize();
};

onMounted(() => {
  setTimeout(() => {
    initLineChart();
    initBarChart();
    initPieChart();
    initScatterChart();
    initRadarChart();
    initGaugeChart();
    window.addEventListener('resize', handleResize);
  }, 200);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  lineChart?.dispose();
  barChart?.dispose();
  pieChart?.dispose();
  scatterChart?.dispose();
  radarChart?.dispose();
  gaugeChart?.dispose();
});
</script>

<template>
  <div class="echarts-page">
    <h1 class="page-title">ECharts 图表演示</h1>
    
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>折线图 Line Chart</span>
          </template>
          <div ref="lineChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>柱状图 Bar Chart</span>
          </template>
          <div ref="barChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>饼图 Pie Chart</span>
          </template>
          <div ref="pieChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>散点图 Scatter Chart</span>
          </template>
          <div ref="scatterChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>雷达图 Radar Chart</span>
          </template>
          <div ref="radarChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>仪表盘 Gauge Chart</span>
          </template>
          <div ref="gaugeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.echarts-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-container {
  width: 100%;
  height: 350px;
}
</style>
