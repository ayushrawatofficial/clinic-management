import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../services/loader';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.html',
  styleUrls: ['./loader.scss']
})
export class LoaderComponent {

  @Input() localLoading = false;

  constructor(public loader: LoaderService) {}
}