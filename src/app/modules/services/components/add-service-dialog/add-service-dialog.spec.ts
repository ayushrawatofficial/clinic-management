import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddServiceDialogComponent } from './add-service-dialog';



describe('AddServiceDialog', () => {
  let component: AddServiceDialogComponent;
  let fixture: ComponentFixture<AddServiceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddServiceDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddServiceDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
