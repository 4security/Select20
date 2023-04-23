import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExplainPage } from './explain.page';

describe('ExplainPage', () => {
  let component: ExplainPage;
  let fixture: ComponentFixture<ExplainPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ExplainPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
