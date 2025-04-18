import { Component, OnInit } from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { RecorderserviceService } from '../../../../core/services/recorderSettings/recorderservice.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-voltageenergygraph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voltageenergygraph.component.html',
  styleUrl: './voltageenergygraph.component.css',
  providers: [RecorderserviceService]
})
export class VoltageenergygraphComponent implements OnInit {
  chart: any;
  channeldata: any = []





  ngOnInit(): void {
    this.getGraphData()


  }
  constructor(
    private recorderserive: RecorderserviceService,
  ) {

  }
 

  getGraphData() {



    this.recorderserive.getVoltageEnergy({}).subscribe((result: any) => {
    if (result.status==true) {
      this.channeldata = result.data
    }else{
      this.channeldata=[]
    }
      
     
    })

  }
}
